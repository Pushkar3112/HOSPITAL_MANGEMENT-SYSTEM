const axios = require('axios');

const API_URL = 'http://localhost:5000/api/doctor-search';

async function measureLatency(url, numRequests = 10) {
    const latencies = [];
    console.log(`\nSending ${numRequests} requests to ${url}...`);

    for (let i = 0; i < numRequests; i++) {
        const start = Date.now();
        try {
            await axios.get(url);
        } catch (err) {
            console.error(`Request ${i + 1} failed:`, err.message);
        }
        const end = Date.now();
        latencies.push(end - start);
        console.log(`Request ${i + 1}: ${end - start}ms`);
    }

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    console.log(`\nAverage Latency: ${avg.toFixed(2)}ms`);
    return avg;
}

async function runTest() {
    console.log('--- REDIS CACHING LATENCY TEST ---');

    // Need to hit a route to warm up cache
    // 1. Initial Request (Cache Miss)
    console.log('\n--- Test 1: Cold Start (Cache Miss) ---');
    await measureLatency(`${API_URL}?specialization=cardiologist&page=1`, 1);

    // 2. Subsequent Requests (Cache Hits)
    console.log('\n--- Test 2: Cached Requests (Cache Hits) ---');
    await measureLatency(`${API_URL}?specialization=cardiologist&page=1`, 10);

    // 3. Uncached Request (Different parameters to force DB hit)
    console.log('\n--- Test 3: Uncached Requests (Cache Misses due to changing params) ---');
    await measureLatency(`${API_URL}?specialization=neurologist&page=1`, 1);

    console.log('\nTest Complete!');
}

runTest();
