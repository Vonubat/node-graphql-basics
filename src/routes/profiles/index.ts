import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

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
        throw fastify.httpErrors.notFound();
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
        throw fastify.httpErrors.notFound();
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
        throw fastify.httpErrors.notFound();
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
