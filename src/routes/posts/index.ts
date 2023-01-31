import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    const posts: PostEntity[] = await fastify.db.posts.findMany();
    return posts;
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id: postId } = request.params;

      const foundedPost: PostEntity | null = await fastify.db.posts.findOne({
        key: 'id',
        equals: postId,
      });
      if (!foundedPost) {
        throw fastify.httpErrors.notFound('Post not found');
      }
      return foundedPost;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { body: postDTO } = request;

      const createdPost: PostEntity = await fastify.db.posts.create(postDTO);
      return createdPost;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id: postId } = request.params;

      const foundedPost: PostEntity | null = await fastify.db.posts.findOne({
        key: 'id',
        equals: postId,
      });
      if (!foundedPost) {
        throw fastify.httpErrors.badRequest(`Post doesn't exist`);
      }

      const deletedPost: PostEntity = await fastify.db.posts.delete(postId);
      return deletedPost;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id: postId } = request.params;
      const { body: postDTO } = request;

      const foundedPost: PostEntity | null = await fastify.db.posts.findOne({
        key: 'id',
        equals: postId,
      });
      if (!foundedPost) {
        throw fastify.httpErrors.badRequest(`Post doesn't exist`);
      }

      const updatedPost: PostEntity = await fastify.db.posts.change(
        postId,
        postDTO
      );
      return updatedPost;
    }
  );
};

export default plugin;
