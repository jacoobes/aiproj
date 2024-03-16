import { loadModel } from 'gpt4all'

export class Embedder { 
    /**
     * @type {import('gpt4all').EmbeddingModel}
     */
    __embedder;
    async init() {
       this.__embedder = await loadModel('all-MiniLM-L6-v2-f16.gguf', { type: 'embedding' })
    }


    embed(text) {
        return this.__embedder.embed(text);
    }
}
