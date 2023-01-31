import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    const profiles: ProfileEntity[] = await fastify.db.profiles.findMany();
    return profiles;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id: profileId } = request.params;

      const foundedProfile: ProfileEntity | null =
        await fastify.db.profiles.findOne({
          key: 'id',
          equals: profileId,
        });
      if (!foundedProfile) {
        throw fastify.httpErrors.notFound('Profile not found');
      }
      return foundedProfile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { body: profileDTO } = request;
      const { userId, memberTypeId } = profileDTO;

      const foundedUser: UserEntity | null = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });
      if (!foundedUser) {
        throw fastify.httpErrors.badRequest(`User doesn't exist`);
      }

      const foundedProfile: ProfileEntity | null =
        await fastify.db.profiles.findOne({
          key: 'userId',
          equals: userId,
        });
      if (foundedProfile) {
        throw fastify.httpErrors.badRequest(`User already has a profile`);
      }

      const foundedMemberType: MemberTypeEntity | null =
        await fastify.db.memberTypes.findOne({
          key: 'id',
          equals: memberTypeId,
        });
      if (!foundedMemberType) {
        throw fastify.httpErrors.badRequest(`MemberTypeId is incorrect`);
      }

      const createdProfile: ProfileEntity = await fastify.db.profiles.create(
        profileDTO
      );
      return createdProfile;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id: profileId } = request.params;

      const foundedProfile: ProfileEntity | null =
        await fastify.db.profiles.findOne({
          key: 'id',
          equals: profileId,
        });
      if (!foundedProfile) {
        throw fastify.httpErrors.badRequest(`Profile doesn't exist`);
      }

      const deletedProfile: ProfileEntity = await fastify.db.profiles.delete(
        profileId
      );
      return deletedProfile;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id: profileId } = request.params;
      const { body: profileDTO } = request;

      const foundedProfile: ProfileEntity | null =
        await fastify.db.profiles.findOne({
          key: 'id',
          equals: profileId,
        });
      if (!foundedProfile) {
        throw fastify.httpErrors.badRequest(`Profile doesn't exist`);
      }

      const updatedProfile: ProfileEntity = await fastify.db.profiles.change(
        profileId,
        profileDTO
      );
      return updatedProfile;
    }
  );
};

export default plugin;
