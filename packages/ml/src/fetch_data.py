# fetch_data.py - Fetches stock price history from Supabase
# This script connects to your database and retrieves historical stock prices
# that were previously saved by your Node.js backend.

# ============================================================================
# IMPORTS - Loading the tools we need
# ============================================================================

import os          # For reading file paths and environment variables
import sys         # For reading command line arguments (like "AAPL")
import json        # For converting Python data to JSON format

from dotenv import load_dotenv      # Reads .env files (like Node's dotenv)
from supabase import create_client  # Supabase database client for Python

# ============================================================================
# CONFIGURATION - Setting up the database connection
# ============================================================================

# load_dotenv() reads a .env file and makes its values available via os.getenv()
#
# os.path.realpath(__file__) = the FULL path to THIS script (resolves symlinks too)
# os.path.dirname() = get the folder containing the file
# We go up three levels: src → ml → packages → then into backend/.env
#
# This is like doing: require('dotenv').config({ path: '../backend/.env' }) in Node
script_dir = os.path.dirname(os.path.realpath(__file__))  # /packages/ml/src
ml_dir = os.path.dirname(script_dir)                       # /packages/ml
packages_dir = os.path.dirname(ml_dir)                     # /packages
env_path = os.path.join(packages_dir, "backend", ".env")   # /packages/backend/.env
load_dotenv(env_path)

# create_client() connects to Supabase - similar to createClient() in Node.js
# It needs two things from the .env file:
#   - SUPABASE_URL: Your database URL (https://xxxxx.supabase.co)
#   - SUPABASE_SERVICE_KEY: Secret key to access the database
#
# os.getenv("VARIABLE_NAME") reads environment variables (like process.env.VARIABLE_NAME in Node)
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# ============================================================================
# MAIN FUNCTION - The actual work happens here
# ============================================================================

def fetch_stock_history(symbol: str, days: int = 60):
    """
    Fetch historical stock data from Supabase.

    Args:
        symbol: Stock ticker (e.g., "AAPL", "MSFT", "GOOGL")
        days: Number of days of history to fetch (default: 60)

    Returns:
        List of price records, or error dict if stock not found
    """
    
    # -------------------------------------------------------------------------
    # STEP 1: Find the stock in the database
    # -------------------------------------------------------------------------
    # Your database has two tables:
    #   - "stocks" table: Contains stock info (id, symbol, name, etc.)
    #   - "prices" table: Contains daily prices (linked to stocks via stock_id)
    #
    # We first need to find the stock's ID so we can look up its prices.
    #
    # This is equivalent to the SQL query:
    #   SELECT id FROM stocks WHERE symbol = 'AAPL' LIMIT 1
    #
    # Breaking down the Python code:
    #   .table("stocks")     → Which table to query
    #   .select("id")        → Which columns to return
    #   .eq("symbol", symbol)→ WHERE symbol = 'AAPL'
    #   .single()            → Expect exactly one result (like LIMIT 1)
    #   .execute()           → Run the query!
    
    stock_result = supabase.table("stocks") \
        .select("stock_id") \
        .eq("symbol", symbol) \
        .single() \
        .execute()

    # Check if we found the stock
    # If not, return an error message
    if not stock_result.data:
        return {"error": f"Stock {symbol} not found in database"}

    # Extract the stock ID from the result
    # stock_result.data looks like: {"stock_id": 123}
    stock_id = stock_result.data["stock_id"]

    # -------------------------------------------------------------------------
    # STEP 2: Get the price history for this stock
    # -------------------------------------------------------------------------
    # Now we query the "prices" table using the stock_id we found.
    #
    # This is equivalent to the SQL query:
    #   SELECT trade_date, open_price, high_price, low_price, close_price, volume
    #   FROM prices
    #   WHERE stock_id = 123
    #   ORDER BY trade_date DESC
    #   LIMIT 60
    #
    # Breaking down the Python code:
    #   .table("prices")              → Which table to query
    #   .select("trade_date, ...")    → Which columns to return
    #   .eq("stock_id", stock_id)     → WHERE stock_id = 123
    #   .order("trade_date", desc=True) → ORDER BY trade_date DESC (newest first)
    #   .limit(days)                  → LIMIT 60 (only get 60 rows)
    #   .execute()                    → Run the query!
    
    prices_result = supabase.table("prices") \
        .select("trade_date, open_price, high_price, low_price, close_price, volume") \
        .eq("stock_id", stock_id) \
        .order("trade_date", desc=True) \
        .limit(days) \
        .execute()

    # -------------------------------------------------------------------------
    # STEP 3: Format the data for output
    # -------------------------------------------------------------------------
    # prices_result.data is a list of dictionaries, like:
    # [
    #   {"trade_date": "2025-01-08", "open_price": "150.00", ...},
    #   {"trade_date": "2025-01-07", "open_price": "149.50", ...},
    #   ...
    # ]
    #
    # We convert it to a cleaner format and ensure numbers are actual numbers
    # (Supabase sometimes returns them as strings)
    
    records = []  # Empty list to store our formatted records
    
    for row in prices_result.data:
        # For each row from the database, create a clean dictionary
        records.append({
            "date": row["trade_date"],           # Keep as string (YYYY-MM-DD)
            "open": float(row["open_price"]),    # Convert to decimal number
            "high": float(row["high_price"]),    # Convert to decimal number
            "low": float(row["low_price"]),      # Convert to decimal number
            "close": float(row["close_price"]),  # Convert to decimal number
            "volume": int(row["volume"])         # Convert to whole number
        })

    # -------------------------------------------------------------------------
    # STEP 4: Reverse the order (oldest first)
    # -------------------------------------------------------------------------
    # We fetched with ORDER BY trade_date DESC, so newest dates are first.
    # But for ML training, we want chronological order (oldest → newest).
    # This is because the model learns patterns over time.
    #
    # Before: [Jan 8, Jan 7, Jan 6, ...]
    # After:  [..., Jan 6, Jan 7, Jan 8]
    
    records.reverse()

    return records


# ============================================================================
# SCRIPT ENTRY POINT - Runs when you execute this file directly
# ============================================================================
# In Python, this block only runs when you call: python fetch_data.py AAPL
# It does NOT run if another script imports this file.
# Similar to: if (require.main === module) in Node.js

if __name__ == "__main__":
    
    # sys.argv is a list of command line arguments
    # sys.argv[0] = "fetch_data.py" (the script name)
    # sys.argv[1] = "AAPL" (the first argument you passed)
    #
    # Similar to: process.argv in Node.js (but Node's starts at index 2)
    
    # Check if user provided a stock symbol
    if len(sys.argv) < 2:
        # No symbol provided, print error and exit
        print(json.dumps({"error": "Please provide a stock symbol"}))
        sys.exit(1)  # Exit with error code 1
    
    # Get the symbol and convert to uppercase
    # "aapl" → "AAPL"
    symbol = sys.argv[1].upper()
    
    # Call our function to fetch the data
    data = fetch_stock_history(symbol)
    
    # Convert Python list/dict to JSON string and print it
    # indent=2 makes it pretty-printed (easier to read)
    #
    # This output is what Node.js will capture when it runs this script
    print(json.dumps(data, indent=2))
