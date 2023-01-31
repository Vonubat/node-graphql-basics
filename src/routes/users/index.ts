import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { omit } from 'lodash';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    const users: UserEntity[] = await fastify.db.users.findMany();
    return users;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.notFound();
      }
      return foundedUser;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { body } = request;
      const createdUser: UserEntity = await fastify.db.users.create(body);
      return createdUser;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.notFound();
      }
      const deletedUser: UserEntity = await fastify.db.users.delete(id);
      return deletedUser;
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const { userId } = request.body;
      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.notFound();
      }
      foundedUser.subscribedToUserIds.push(id);
      const updatedUser: UserEntity = await fastify.db.users.change(
        userId,
        omit(foundedUser, 'id')
      );
      return updatedUser;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { userId } = request.body;
      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.notFound();
      }

      const newSubscribedToUserIds: string[] =
        foundedUser.subscribedToUserIds.filter((item) => item !== userId);

      return await fastify.db.users.change(userId, {
        ...omit(foundedUser, 'id'),
        subscribedToUserIds: newSubscribedToUserIds,
      });
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const { body } = request;
      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.notFound();
      }
      const updatedUser: UserEntity = await fastify.db.users.change(id, body);
      return updatedUser;
    }
  );
};

export default plugin;
