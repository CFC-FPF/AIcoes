import axios from 'axios';
import { supabase } from '../lib/supabase';

const stocks = [
  { stock_id: 1, symbol: 'AAPL' },
  { stock_id: 2, symbol: 'MSFT' },
  { stock_id: 3, symbol: 'GOOGL' }
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseCSV(csv: string): any[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i]);
    return obj;
  });
}

async function fetchAndStore(stockId: number, symbol: string): Promise<void> {
  console.log(`\n📡 Fetching ${symbol}...`);

  try {
    // 2 years ago
    const period1 = Math.floor(new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).getTime() / 1000);
    const period2 = Math.floor(Date.now() / 1000);

    // Direct Yahoo Finance CSV download URL
    const url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history`;

    console.log(`📥 Downloading from Yahoo Finance...`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv,application/csv,text/plain,*/*'
      }
    });

    const data = parseCSV(response.data as string);

    if (data.length === 0) {
      console.log(`❌ No data for ${symbol}`);
      return;
    }

    console.log(`📊 Got ${data.length} days of data`);

    const records = data
      .filter((q: any) => q.Open && q.High && q.Low && q.Close && q.Open !== 'null')
      .map((q: any) => ({
        stock_id: stockId,
        trade_date: q.Date,
        open_price: parseFloat(q.Open),
        high_price: parseFloat(q.High),
        low_price: parseFloat(q.Low),
        close_price: parseFloat(q.Close),
        volume: parseInt(q.Volume) || 0
      }));

    const { error } = await supabase.from('prices').upsert(records, {
      onConflict: 'stock_id,trade_date',
      ignoreDuplicates: false
    });

    if (error) {
      console.log(`❌ DB error for ${symbol}: ${error.message}`);
    } else {
      const firstDate = records[0].trade_date;
      const lastDate = records[records.length - 1].trade_date;
      console.log(`✅ ${symbol}: Saved ${records.length} days (${firstDate} to ${lastDate})`);
    }
  } catch (err: any) {
    console.log(`❌ Error fetching ${symbol}: ${err.message}`);
    if (err.response) {
      console.log(`   Status: ${err.response.status}`);
    }
  }
}

async function run(): Promise<void> {
  console.log('🚀 Manual Stock Data Fetch');
  console.log('==========================');

  for (const stock of stocks) {
    await fetchAndStore(stock.stock_id, stock.symbol);
    console.log('⏳ Waiting 3 seconds before next...');
    await sleep(3000);
  }

  console.log('\n✨ Done!');
  process.exit(0);
}

run();
