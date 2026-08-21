"""
Dataset Exporter for Paytm IntentGuard.
Exports the 100 personas and 10,000+ historical transactions into CSV and JSON files
under backend/data/.
"""
import os
import json
import csv
from typing import Dict, Any, List
from backend.app.simulation.persona_generator import generate_personas
from backend.app.simulation.transaction_generator import generate_historical_transactions

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def export_all_datasets(personas_count: int = 100, tx_count: int = 10000, seed: int = 42) -> Dict[str, str]:
    """
    Generates and persists synthetic dataset files to disk.
    Returns file paths of generated artifacts.
    """
    ensure_data_dir()

    # 1. Generate Personas
    personas = generate_personas(count=personas_count, seed=seed)
    personas_json_path = os.path.join(DATA_DIR, "synthetic_personas.json")
    with open(personas_json_path, "w", encoding="utf-8") as f:
        json.dump(personas, f, indent=2)

    personas_csv_path = os.path.join(DATA_DIR, "synthetic_personas.csv")
    with open(personas_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "user_id", "name", "income_band", "persona_type", "upi_handle",
            "typical_transaction_amount", "amount_std", "usual_start_hour",
            "usual_end_hour", "usual_regions", "known_devices", "known_recipients_count",
            "transaction_frequency"
        ])
        for p in personas:
            writer.writerow([
                p["user_id"],
                p["name"],
                p["income_band"],
                p["persona_type"],
                p["upi_handle"],
                p["typical_transaction_amount"],
                p["amount_std"],
                p["usual_start_hour"],
                p["usual_end_hour"],
                ";".join(p["usual_regions"]),
                ";".join(p["known_devices"]),
                len(p["known_recipients"]),
                p["transaction_frequency"]
            ])

    # 2. Generate Transactions
    transactions = generate_historical_transactions(personas, target_count=tx_count, seed=seed)
    tx_json_path = os.path.join(DATA_DIR, "synthetic_transactions.json")
    with open(tx_json_path, "w", encoding="utf-8") as f:
        json.dump(transactions, f, indent=2)

    tx_csv_path = os.path.join(DATA_DIR, "synthetic_transactions.csv")
    with open(tx_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "transaction_id", "user_id", "recipient_id", "recipient_name",
            "recipient_upi", "amount", "timestamp", "transaction_type",
            "device_id", "location", "is_known_recipient", "is_known_device",
            "recent_transaction_count", "failed_attempts", "scenario_id", "label"
        ])
        for t in transactions:
            writer.writerow([
                t["transaction_id"],
                t["user_id"],
                t["recipient_id"],
                t["recipient_name"],
                t["recipient_upi"],
                t["amount"],
                t["timestamp"],
                t["transaction_type"],
                t["device_id"],
                t["location"],
                t["is_known_recipient"],
                t["is_known_device"],
                t["recent_transaction_count"],
                t["failed_attempts"],
                t["scenario_id"],
                t["label"]
            ])

    return {
        "personas_json": personas_json_path,
        "personas_csv": personas_csv_path,
        "transactions_json": tx_json_path,
        "transactions_csv": tx_csv_path,
        "total_personas": len(personas),
        "total_transactions": len(transactions)
    }

if __name__ == "__main__":
    result = export_all_datasets()
    print("Dataset export completed successfully:", result)
