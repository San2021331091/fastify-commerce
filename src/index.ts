import Fastify from 'fastify'; 
import cors from '@fastify/cors';
import AdminJS from 'adminjs';
import AdminJSFastify from '@adminjs/fastify';
import AdminJSSequelize from '@adminjs/sequelize';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import {
  sequelize,
  Product,
  Review,
  User,
  Category,
  ImageCarousel,
  CartItem,
  Payment,
  Order
} from './models.js';
import { AddToCartRequestBody } from './types/CartItemTypes.js';
import { UserPayload } from './types/UserpayloadTypes.js';
import { PaymentIntentRequestBody } from './types/PaymentIntent.js';
import { OrderRequestBody } from './types/OrderRequestTypes.js';

dotenv.config();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: '*', 
});


const jwtSecret = process.env.SUPABASE_JWT_SECRET;
if (!jwtSecret) {
  throw new Error('SUPABASE_JWT_SECRET environment variable is not set');
}

app.register(fastifyJwt, {
  secret: jwtSecret,
});

app.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});


const adminJs = new AdminJS({
  rootPath: '/admin',
  resources: [
    Product,
    Review,
    User,
    Category,
    ImageCarousel,
    CartItem,
    Payment,
    {
      resource: Order,
      options: {
        actions: {
          approve: {
            actionType: 'record',
            icon: 'Checkmark',
            label: '✅ Approve & Email',
            component: false,
            guard: 'Are you sure you want to approve this order and email the user?',
            handler: async (_request: any, _response: any, context: any) => {
              const { currentAdmin, record } = context;

              // Ensure admin access
              if (!currentAdmin || currentAdmin.role !== 'admin') {
                return {
                  record: record.toJSON(),
                  notice: {
                    message: '❌ Only admins can approve orders',
                    type: 'error',
                  },
                };
              }

              // Approve the current order
              await record.update({ status: 'approved' });

              // Fetch order data from record params
              const orderData = record.params;

              // Find the user by uid
              const user = await User.findOne({ where: { uid: orderData.user_uid } });
              if (!user || !user.dataValues.email) {
                return {
                  record: record.toJSON(),
                  notice: {
                    message: '❌ User not found or missing email',
                    type: 'error',
                  },
                };
              }

              // Find all approved orders for this user
              const approvedOrders = await Order.findAll({
                where: {
                  user_uid: orderData.user_uid,
                  status: 'approved',
                },
              });

              // Convert Sequelize instances to plain objects
              const ordersPlain = approvedOrders.map(order => order.get({ plain: true }));

            
              const invoiceItems = ordersPlain.map(order => ({
                productId: order.product_id.toString(),  // Convert to string if needed
                img_url: order.img_url,
                quantity: order.quantity,
                price: Number(order.price),
              }));

              // Calculate total price
              const total = invoiceItems.reduce((sum, item) => sum + item.price, 0);

              // Generate invoice PDF path
              const path = `./invoices/invoice-${orderData.user_uid}-${Date.now()}.pdf`;

              // Dynamically import PDF generator and email sender utils
              const { generateInvoicePDF } = await import('./utils/pdfGenerator.js');
              const { sendInvoiceEmail } = await import('./utils/emailSender.js');

              // Generate the PDF invoice
              await generateInvoicePDF(invoiceItems, total, path);

              // Send the invoice email to the user
              await sendInvoiceEmail(user.dataValues.email, path);

              return {
                record: record.toJSON(),
                notice: {
                  message: '✅ Order approved and invoice emailed',
                  type: 'success',
                },
              };
            },
          },
        },
      },
    },
  ],
  branding: { companyName: 'Smart Cart' },
});


export default adminJs;


app.post<{ Body: OrderRequestBody }>(
  '/orders',
  { preValidation: [app.authenticate] },
  async (request, reply) => {
    const user = request.user as any;
    const { items, total } = request.body;

    if (!Array.isArray(items) || items.length === 0 || !total) {
      return reply.code(400).send({ error: 'Missing required fields: items or total' });
    }

    try {
      const createdOrders = await Promise.all(
        items.map(async (item) => {
          const { productId, img_url, quantity, price } = item;

          if (!productId || !img_url || !quantity || !price) {
            throw new Error('Invalid item data');
          }

          return await Order.create({
            user_uid: user.uid ?? user.sub,
            product_id: parseInt(productId),
            img_url,
            quantity,
            price,
            ordered_at: new Date(),
            status: 'pending',
          });
        })
      );

      return reply.code(201).send({
        message: '✅ Order placed successfully',
        orders: createdOrders,
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Failed to place order' });
    }
  }
);



app.get('/', (_, reply) => {
  reply.send({ status: 'Server is running' });
});

app.get('/profile', async (req, reply) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await app.jwt.verify(token);

    return {
      message: '✅ Authenticated',
      user: decoded,
    };
  } catch (err) {
    console.error('JWT verification failed:', err);
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
});


app.post<{ Body: UserPayload }>(
  '/login',
  { preValidation: [app.authenticate] },
  async (request, reply) => {
    const { uid, email, name } = request.body;

    if (!uid || !email) {
      return reply.status(400).send({ error: 'Missing user information (uid or email)' });
    }

    app.log.info(`Received user info - UID: ${uid}, Email: ${email}, Name: ${name || '(none)'}`);

    try {
      const [user, created] = await User.upsert({ uid, email, name });

      return reply.send({
        message: created ? 'User created' : 'User updated',
        user,
      });
    } catch (error) {
      app.log.error('Failed to save user:', error);
      return reply.status(500).send({ error: 'Database error' });
    }
  }
);
//add to cart endpoint
app.post<{ Body: AddToCartRequestBody }>('/add_cart', async (request, reply) => {
  const { user_uid, product_id,img_url, quantity = 1,price} = request.body;

  // 🔍 Log the incoming data
  request.log.info({ user_uid, product_id,img_url,quantity,price}, 'Add to cart called');

  if (!img_url || !price) {
    return reply.code(400).send({ error: 'Missing user_uid, product_id, img_url, or price' });
  }

  try {
    const item = await CartItem.create({
      user_uid,
      product_id,
      img_url,
      quantity,
      price
    });

    return reply.send({ message: 'Item added to cart', item });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Could not add to cart' });
  }
});
//deleting all cart items for a user
app.delete('/cart_items', { preValidation: [app.authenticate] }, async (request, reply) => {
  const user = request.user as any;  // allow flexible access to token payload

  request.log.info({ user }, 'Decoded JWT user');

  // Extract user ID from token, fallback from uid to sub (Supabase default)
  const userId = user.uid ?? user.sub;

  if (!userId) {
    return reply.status(400).send({ error: 'User ID missing from token' });
  }

  try {
    const deletedCount = await CartItem.destroy({
      where: { user_uid: userId },
    });

    return reply.send({
      message: `🗑️ Deleted ${deletedCount} cart item(s) for user`,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to delete cart items' });
  }
});

app.get('/payments', async (request, reply) => {
  try {
    const payments = await Payment.findAll({
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['cvv', 'card_number','expiry'] }, 
    });

    return reply.send({
      status: 'success',
      data: payments,
    });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({
      status: 'error',
      message: 'Failed to fetch payments',
    });
  }
});

app.get('/payments/user', { preValidation: [app.authenticate] }, async (request, reply) => {
  try {
    const user = request.user;

    if (!user?.email) {
      return reply.code(400).send({ error: 'Email not found in token' });
    }

    const payments = await Payment.findAll({
      where: { email: user.email },
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['cvv', 'card_number'] },
    });

    return reply.send({
      status: 'success',
      count: payments.length,
      data: payments,
    });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to fetch payments' });
  }
});

app.post<{ Body: PaymentIntentRequestBody }>('/create-payment-intent', async (request, reply) => {
  let { amount, card_type, card_number, expiry, cvv, email, username } = request.body;

  if (typeof amount === 'string') {
    amount = Math.round(Number(amount));
  }

  if (!amount || typeof amount !== 'number' || isNaN(amount)) {
    return reply.code(400).send({ error: 'Amount must be a valid number in cents (e.g., 1099)' });
  }

  if (!card_type || !['visa', 'mastercard'].includes(card_type)) {
    return reply.code(400).send({ error: 'Invalid or missing card_type' });
  }

  if (!card_number || !expiry || !cvv) {
    return reply.code(400).send({ error: 'Missing card details' });
  }

  try {
    // 🔍 Check for recent duplicate (last 2 minutes)
    const recent = await Payment.findOne({
      where: {
        amount,
        card_type,
        expiry,
        email,
        username,
        status: 'success',
      },
      order: [['created_at', 'DESC']],
    });

    if (recent && recent.created_at) {
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      const recentTime = new Date(recent?.created_at).getTime();

      if (recentTime > twoMinutesAgo) {
        return reply.send({
          message: '⚠️ Duplicate payment ignored (already processed recently)',
          paymentId: recent?.id,
        });
      }
    }

    const payment = await Payment.create({
      amount,
      card_type,
      card_number,
      expiry,
      cvv,
      email,
      username,
      status: 'success',
    });

    return reply.send({
      message: '✅ Payment processed successfully',
      paymentId: payment?.id,
    });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to process payment' });
  }
});

async function start() {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅ DB Connected');

    // Sync models to DB
    await sequelize.sync();

    // AdminJS with authentication
    await AdminJSFastify.buildAuthenticatedRouter(
      adminJs,
      {
        authenticate: async (email: string, password: string) => {
          if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            return { email, role: 'admin' }; 
          }
          return null;
        },
        cookieName: 'adminjs',
        cookiePassword:process.env.ADMIN_COOKIE_SECRET!,
      },
      app
    );

    // Start Fastify server
   const PORT = parseInt(process.env.PORT || '8900', 10);
   await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running: http://localhost:${PORT}`);
    console.log(`🛠️ Admin Panel: http://localhost:${PORT}${adminJs.options.rootPath}`);
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
}


start();
