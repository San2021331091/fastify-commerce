import 'fastify';
import { UserPayload } from './types/UserpayloadTypes';
declare module 'fastify' {
  interface FastifyInstance {
    authenticate(
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<void>;
  }

  interface FastifyRequest {
    user: UserPayload;
  }
}
