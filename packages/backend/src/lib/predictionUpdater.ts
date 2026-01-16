// predictionUpdater.ts - Auto-update predictions when stale
// Runs ML model to regenerate predictions based on latest price data

import { spawn } from 'child_process';
import path from 'path';
import { supabase } from './supabase';

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
    const process = spawn(PYTHON_PATH, [SCRIPT_PATH, symbol]);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

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
 * Check if predictions need to be updated
 * Returns true if predictions are stale (older than today or don't exist)
 */
async function arePredictionsStale(stockId: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  // Check if we have predictions generated today
  const { data, error } = await supabase
    .from('predictions')
    .select('prediction_date')
    .eq('stock_id', stockId)
    .order('prediction_date', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return true; // No predictions exist
  }

  // Predictions are stale if not generated today
  return data[0].prediction_date !== today;
}

/**
 * Save predictions to Supabase
 */
async function savePredictions(
  stockId: number,
  modelVersion: string,
  predictions: Prediction[]
): Promise<void> {
  const records = predictions.map(p => ({
    stock_id: stockId,
    prediction_date: new Date().toISOString().split('T')[0],
    target_date: p.target_date,
    predicted_close_price: p.predicted_close,
    confidence_score: p.confidence,
    model_version: modelVersion
  }));

  // Delete existing predictions for this stock
  await supabase
    .from('predictions')
    .delete()
    .eq('stock_id', stockId);

  // Insert new predictions
  const { error: insertError } = await supabase
    .from('predictions')
    .insert(records);

  if (insertError) {
    throw new Error(`Failed to save predictions: ${insertError.message}`);
  }
}

/**
 * Update predictions if they are stale
 * Called automatically when fetching predictions for a stock
 */
export async function updatePredictionsIfNeeded(
  stockId: number,
  symbol: string
): Promise<void> {
  const isStale = await arePredictionsStale(stockId);

  if (!isStale) {
    console.log(`📊 [${symbol}] Predictions are up-to-date, skipping regeneration`);
    return;
  }

  console.log(`🤖 [${symbol}] Regenerating predictions with latest data...`);

  try {
    const result = await runPythonPrediction(symbol);

    if (result.error) {
      throw new Error(result.error);
    }

    await savePredictions(stockId, result.model_version, result.predictions);

    console.log(`✅ [${symbol}] Predictions updated: ${result.predictions.length} days`);
  } catch (error: any) {
    console.error(`❌ [${symbol}] Failed to update predictions:`, error.message);
    throw error;
  }
}
