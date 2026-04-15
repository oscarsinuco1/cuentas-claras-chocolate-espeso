import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multiavatar from '@multiavatar/multiavatar';

export async function avatarRoutes(fastify: FastifyInstance) {
  // Generate Multiavatar SVGs locally (no external API calls)
  fastify.get('/avatar/:seed', {
    schema: {
      description: 'Get Multiavatar image by seed (generated locally)',
      tags: ['Avatar'],
      params: {
        type: 'object',
        properties: {
          seed: { type: 'string' }
        },
        required: ['seed']
      }
    }
  }, async (request: FastifyRequest<{ Params: { seed: string } }>, reply: FastifyReply) => {
    const { seed } = request.params;
    
    try {
      // Generate SVG locally using multiavatar library
      const svg = multiavatar(seed);
      
      // Cache for 1 year (avatars are deterministic)
      reply.header('Content-Type', 'image/svg+xml');
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      reply.header('Cross-Origin-Resource-Policy', 'cross-origin');
      reply.header('Access-Control-Allow-Origin', '*');
      
      return reply.send(svg);
    } catch (error) {
      fastify.log.error({ err: error }, 'Avatar generation error');
      return reply.status(500).send({ error: 'Failed to generate avatar' });
    }
  });
}
