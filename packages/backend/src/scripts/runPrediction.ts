// runPrediction.ts - Runs Python ML script and saves predictions to Supabase
// Usage: npx tsx src/scripts/runPrediction.ts AAPL

// FIRST: Load environment variables (must be before other imports)
import "./loadEnv";
import { spawn } from 'child_process';
import path from 'path';
import { supabase } from '../lib/supabase';

// Path to Python virtual environment and script
const ML_DIR = path.join(__dirname, '../../../ml');
const PYTHON_PATH = path.join(ML_DIR, 'venv/bin/python');
const SCRIPT_PATH = path.join(ML_DIR, 'src/predict.py');

interface Prediction {
  target_date: string;
  predicted_close: number;
  confidence: number;
}

interface PredictionResult {
  symbol: string;
  model_version: string;
  historical_days_used: number;
  predictions: Prediction[];
  error?: string;
}

/**
 * Run the Python prediction script and return the results
 */
async function runPythonPrediction(symbol: string): Promise<PredictionResult> {
  return new Promise((resolve, reject) => {
    // Spawn Python process
    const process = spawn(PYTHON_PATH, [SCRIPT_PATH, symbol]);
    
    let stdout = '';
    let stderr = '';
    
    // Collect stdout (the JSON output)
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collect stderr (errors/warnings)
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handle process completion
    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });
    
    process.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

/**
 * Save predictions to Supabase
 */
async function savePredictions(
  symbol: string,
  modelVersion: string,
  predictions: Prediction[]
): Promise<void> {
  // Get stock_id
  const { data: stock, error: stockError } = await supabase
    .from('stocks')
    .select('stock_id')
    .eq('symbol', symbol)
    .single();
  
  if (stockError || !stock) {
    throw new Error(`Stock ${symbol} not found`);
  }
  
  // Prepare prediction records
  const records = predictions.map(p => ({
    stock_id: stock.stock_id,
    prediction_date: new Date().toISOString().split('T')[0], // Today
    target_date: p.target_date,
    predicted_close_price: p.predicted_close,
    confidence_score: p.confidence,
    model_version: modelVersion
  }));
  
  // Delete existing predictions for this stock (to avoid duplicates)
  const { error: deleteError } = await supabase
    .from('predictions')
    .delete()
    .eq('stock_id', stock.stock_id);

  if (deleteError) {
    console.warn('Warning: Could not delete old predictions:', deleteError.message);
  }

  // Insert new predictions
  const { error: insertError } = await supabase
    .from('predictions')
    .insert(records);

  if (insertError) {
    throw new Error(`Failed to save predictions: ${insertError.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  const symbol = process.argv[2]?.toUpperCase();
  
  if (!symbol) {
    console.error('Usage: npx tsx src/scripts/runPrediction.ts AAPL');
    process.exit(1);
  }
  
  console.log(`Generating predictions for ${symbol}...`);
  
  try {
    // Run Python script
    const result = await runPythonPrediction(symbol);
    
    if (result.error) {
      console.error('Error:', result.error);
      process.exit(1);
    }
    
    console.log(`Got ${result.predictions.length} predictions`);
    console.log(`Model: ${result.model_version}`);
    console.log(`Historical days used: ${result.historical_days_used}`);
    
    // Save to database
    await savePredictions(symbol, result.model_version, result.predictions);
    
    console.log('Predictions saved to database!');
    console.log('\nPredictions:');
    result.predictions.forEach(p => {
      console.log(`  ${p.target_date}: $${p.predicted_close.toFixed(2)} (confidence: ${(p.confidence * 100).toFixed(1)}%)`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
