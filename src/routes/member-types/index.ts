import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    const memberTypes: MemberTypeEntity[] =
      await fastify.db.memberTypes.findMany();
    return memberTypes;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { id: memberTypeId } = request.params;

      const foundedMemberType: MemberTypeEntity | null =
        await fastify.db.memberTypes.findOne({
          key: 'id',
          equals: memberTypeId,
        });
      if (!foundedMemberType) {
        throw fastify.httpErrors.notFound();
      }
      return foundedMemberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { id: memberTypeId } = request.params;
      const { body: memberTypeDTO } = request;

      const foundedMemberType: MemberTypeEntity | null =
        await fastify.db.memberTypes.findOne({
          key: 'id',
          equals: memberTypeId,
        });
      if (!foundedMemberType) {
        throw fastify.httpErrors.badRequest('MemberType not found');
      }

      const updatedMemberType: MemberTypeEntity =
        await fastify.db.memberTypes.change(memberTypeId, memberTypeDTO);
      return updatedMemberType;
    }
  );
};

export default plugin;
