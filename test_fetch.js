const fetch = require('node-fetch');

async function test() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
        const data = await response.json();
        console.log('Fetch successful:', data);
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

test();