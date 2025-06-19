import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL!;
export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
});

// ------------------- Product Model -------------------

interface ProductAttributes {
  id: number;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  discountPercentage?: number;
  rating?: number;
  stock?: number;
  tags?: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: object | null;
  availabilityStatus?: string;
  minimumOrderQuantity?: number;
  meta?: object | null;
  images?: string[];
  thumbnail?: string;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public title?: string;
  public description?: string;
  public category?: string;
  public price?: number;
  public discountPercentage?: number;
  public rating?: number;
  public stock?: number;
  public tags?: string[];
  public brand?: string;
  public sku?: string;
  public weight?: number;
  public dimensions?: object | null;
  public availabilityStatus?: string;
  public minimumOrderQuantity?: number;
  public meta?: object | null;
  public images?: string[];
  public thumbnail?: string;
}

Product.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: DataTypes.TEXT,
  description: DataTypes.TEXT,
  category: DataTypes.TEXT,
  price: DataTypes.DECIMAL,
  discountPercentage: {
    type: DataTypes.DECIMAL,
    field: 'discountpercentage',
  },
  rating: DataTypes.DECIMAL,
  stock: DataTypes.INTEGER,
  tags: DataTypes.ARRAY(DataTypes.TEXT),
  brand: DataTypes.TEXT,
  sku: DataTypes.TEXT,
  weight: DataTypes.DECIMAL,
  dimensions: DataTypes.JSONB,
  availabilityStatus: {
    type: DataTypes.TEXT,
    field: 'availabilitystatus',
  },
  minimumOrderQuantity: {
    type: DataTypes.INTEGER,
    field: 'minimumorderquantity',
  },
  meta: DataTypes.JSONB,
  images: DataTypes.ARRAY(DataTypes.TEXT),
  thumbnail: DataTypes.TEXT,
}, {
  sequelize,
  tableName: 'products',
  timestamps: false,
});


// ------------------- Category Model -------------------

interface CategoryAttributes {
  id: number;
  name: string;
  imgurl?: string | null;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public imgurl?: string | null;
}

Category.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  imgurl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'categories',
  timestamps: false,
});

// ------------------- Review Model -------------------

interface ReviewAttributes {
  id: number;
  product_id: number;
  rating?: number;
  comment?: string;
  date?: Date;
  reviewerName?: string;
  reviewerEmail?: string;
}

interface ReviewCreationAttributes extends Optional<ReviewAttributes, 'id'> {}

export class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  public id!: number;
  public product_id!: number;
  public rating?: number;
  public comment?: string;
  public date?: Date;
  public reviewerName?: string;
  public reviewerEmail?: string;
}

Review.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  product_id: {
    type: DataTypes.INTEGER,
    references: { model: 'products', key: 'id' },
    allowNull: false,
  },
  rating: DataTypes.INTEGER,
  comment: DataTypes.TEXT,
  date: DataTypes.DATE,
  reviewerName: {
    type: DataTypes.TEXT,
    field: 'reviewername',
  },
  reviewerEmail: {
    type: DataTypes.TEXT,
    field: 'revieweremail',
  },
}, {
  sequelize,
  tableName: 'reviews',
  timestamps: false,
});

Product.hasMany(Review, { foreignKey: 'product_id' });
Review.belongsTo(Product, { foreignKey: 'product_id' });

// ------------------- User Model -------------------

interface UserAttributes {
  uid: string;
  email: string;
  name?: string;
  role?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'role'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public uid!: string;
  public email!: string;
  public name?: string;
  public role?: string;
}

User.init({
  uid: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: DataTypes.STRING,
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
});

// ------------------- ImageCarousel Model -------------------

interface ImageCarouselAttributes {
  id: number;
  title?: string;
  image_url: string;
}

interface ImageCarouselCreationAttributes extends Optional<ImageCarouselAttributes, 'id'> {}

export class ImageCarousel extends Model<ImageCarouselAttributes, ImageCarouselCreationAttributes> implements ImageCarouselAttributes {
  public id!: number;
  public title?: string;
  public image_url!: string;
}

ImageCarousel.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'image_carousel',
  timestamps: false,
});

// ------------------- CartItem Model -------------------

interface CartItemAttributes {
  id: number;
  user_uid: string;
  product_id: number;
  img_url:string;
  quantity: number;
  added_at?: Date;
  price:number;

}
  

interface CartItemCreationAttributes extends Optional<CartItemAttributes, 'id' | 'added_at'> {}

export class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> implements CartItemAttributes {
  public id!: number;
  public user_uid!: string;
  public product_id!: number;
  public img_url!: string;
  public quantity!: number;
  public added_at?: Date;
  public price!:number;
  
}

CartItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_uid: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'users', key: 'uid' },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'products', key: 'id' },
  },
  img_url:{
   type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  added_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
price: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
}

}, {
  sequelize,
  tableName: 'cart_items',
  timestamps: false,
});

User.hasMany(CartItem, { foreignKey: 'user_uid' });
CartItem.belongsTo(User, { foreignKey: 'user_uid' });

Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

// ------------------- Payment Model -------------------

interface PaymentAttributes {
  id: number;
  amount: number;
  card_type: 'visa' | 'mastercard';
  card_number: string;
  expiry: string;
  cvv: string;
  email?: string;
  username?: string;
  status?: 'pending' | 'success' | 'failed';
  created_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'email' | 'username' | 'status' | 'created_at'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public amount!: number;
  public card_type!: 'visa' | 'mastercard';
  public card_number!: string;
  public expiry!: string;
  public cvv!: string;
  public email?: string;
  public username?: string;
  public status?: 'pending' | 'success' | 'failed';
  public created_at?: Date;
}

Payment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  card_type: {
    type: DataTypes.ENUM('visa', 'mastercard'),
    allowNull: false,
  },
  card_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiry: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cvv: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'payments',
  timestamps: false,
});


// ------------------- Orders Model -------------------
interface OrderAttributes {
  id: number;
  user_uid: string;
  product_id: number;
  img_url: string;
  quantity: number;
  price: number;
  ordered_at?: Date;
  status?: string;  // e.g. 'pending', 'completed', etc.
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'ordered_at' | 'status'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public user_uid!: string;
  public product_id!: number;
  public img_url!: string;
  public quantity!: number;
  public price!: number;
  public ordered_at?: Date;
  public status?: string;
}

Order.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_uid: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'users', key: 'uid' },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'products', key: 'id' },
  },
  img_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  ordered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
}, {
  sequelize,
  tableName: 'orders',
  timestamps: false,
});

User.hasMany(Order, { foreignKey: 'user_uid' });
Order.belongsTo(User, { foreignKey: 'user_uid' });

Product.hasMany(Order, { foreignKey: 'product_id' });
Order.belongsTo(Product, { foreignKey: 'product_id' });
