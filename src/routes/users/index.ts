import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import { omit } from 'lodash';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

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
      const { id: userId } = request.params;

      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.notFound('User not found');
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
      const { body: userDTO } = request;

      const createdUser: UserEntity = await fastify.db.users.create(userDTO);
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
      const { id: userId } = request.params;

      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.badRequest(`User doesn't exist`);
      }

      const userPosts: PostEntity[] = await fastify.db.posts.findMany({
        key: 'userId',
        equals: userId,
      });
      if (userPosts.length) {
        userPosts.map(async (post) => await fastify.db.posts.delete(post.id));
      }

      const userProfile: ProfileEntity | null =
        await fastify.db.profiles.findOne({ key: 'userId', equals: userId });
      if (userProfile) {
        await fastify.db.profiles.delete(userProfile.id);
      }

      const subscribers: UserEntity[] = await fastify.db.users.findMany({
        key: 'subscribedToUserIds',
        inArray: userId,
      });
      if (subscribers.length) {
        subscribers.map(async (subscriber) => {
          const subscriberDTO = omit(subscriber, 'id');

          const filteredSubscribedToUserIds =
            subscriberDTO.subscribedToUserIds.filter(
              (subscriberId) => subscriberId !== userId
            );

          return await fastify.db.users.change(subscriber.id, {
            ...subscriberDTO,
            subscribedToUserIds: filteredSubscribedToUserIds,
          });
        });
      }

      const deletedUser: UserEntity = await fastify.db.users.delete(userId);
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
      const { id: subscribeToUserId } = request.params;
      const { userId: subscriberId } = request.body;

      const foundedSubscriber: UserEntity | null =
        await fastify.db.users.findOne({
          key: 'id',
          equals: subscriberId,
        });
      if (!foundedSubscriber) {
        throw fastify.httpErrors.notFound('Subscriber not found');
      }
      foundedSubscriber.subscribedToUserIds.push(subscribeToUserId);

      const updatedUser: UserEntity = await fastify.db.users.change(
        subscriberId,
        omit(foundedSubscriber, 'id')
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
      const { id: followerId } = request.params;
      const { userId: unsubscribeFromUserId } = request.body;

      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: unsubscribeFromUserId,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.badRequest(`User doesn't exist`);
      }
      if (!foundedUser.subscribedToUserIds.includes(followerId)) {
        throw fastify.httpErrors.badRequest(
          'User is not following to user with ${unsubscribeFromUserId}'
        );
      }

      const filteredSubscribedToUserIds =
        foundedUser.subscribedToUserIds.filter((id) => id !== followerId);

      const updatedUser = await fastify.db.users.change(unsubscribeFromUserId, {
        ...omit(foundedUser, 'id'),
        subscribedToUserIds: filteredSubscribedToUserIds,
      });
      return updatedUser;
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
      const { id: userId } = request.params;
      const { body: userDTO } = request;

      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.badRequest(`User doesn't exist`);
      }

      const updatedUser: UserEntity = await fastify.db.users.change(
        userId,
        userDTO
      );
      return updatedUser;
    }
  );
};

export default plugin;
