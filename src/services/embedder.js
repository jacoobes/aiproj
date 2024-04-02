import { loadModel, createEmbedding } from 'gpt4all'

export class Embedder { 
    default_options = {

    }
    /**
     * @type {import('gpt4all').EmbeddingModel}
     */
    __embedder;
    async init() {
        this.__embedder = await loadModel('nomic-embed-text-v1.5.f16.gguf', { type: 'embedding', device: 'gpu' });
    }

    embed(text, options) {
        return createEmbedding(this.__embedder, text, { ...options, ...this.default_options });
    }
}
