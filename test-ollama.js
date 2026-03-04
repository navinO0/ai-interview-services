async function test() {
    try {
        console.log('Testing Ollama direct access with dynamic import...');
        const { Ollama } = await import('ollama');
        const ollama = new Ollama({ host: 'http://localhost:11434' });
        const list = await ollama.list();
        console.log('Models found:', list.models.length);
        console.log('SUCCESS');
        process.exit(0);
    } catch (error) {
        console.error('FAILURE:', error);
        process.exit(1);
    }
}

test();
