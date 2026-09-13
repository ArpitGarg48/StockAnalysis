import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const symbol = 'RELIANCE.NS'; // Assuming Indian stocks are used
    const now = new Date();
    const period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    console.log('Fetching historical for:', symbol);
    const historical = await yahooFinance.historical(symbol, {
      period1: period1.toISOString().split('T')[0],
      period2: now.toISOString().split('T')[0],
      interval: '1d',
    });
    
    console.log('Success, found records:', historical.length);
    if (historical.length > 0) {
      console.log('Last record:', historical[historical.length - 1].date);
    }
  } catch (err) {
    console.error('Error fetching historical:', err);
  }
}

test();
