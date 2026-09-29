import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

FEATURE_NAMES = [
    "accuracy",
    "recent_accuracy",
    "average_confidence",
    "confidence_accuracy_gap",
    "average_response_time",
    "repeated_error_count",
    "prerequisite_score",
    "attempt_count",
]

class ConfusionPredictor:
    """
    Interpretable Machine Learning component for estimating student concept confusion.
    Trains Logistic Regression and Random Forest models on learning behavior features.
    Provides feature importances and contributing factors for explainability.
    """

    def __init__(self, model_dir: str = None):
        if model_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_dir = os.path.join(base_dir, "ml")
        self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)
        
        self.lr_model_path = os.path.join(self.model_dir, "logistic_regression.joblib")
        self.rf_model_path = os.path.join(self.model_dir, "random_forest.joblib")
        
        self.lr_model: LogisticRegression = None
        self.rf_model: RandomForestClassifier = None
        self.metrics: Dict[str, Dict[str, float]] = {}
        
        # Load or initialize
        self._load_or_train()

    def _generate_synthetic_data(self, n_samples: int = 1200) -> pd.DataFrame:
        """
        Generates clearly labeled synthetic student learning records for model training.
        Simulates realistic educational metrics:
        - Confusion often presents as low accuracy with high confidence (misconception)
          or repeated errors on specific prerequisite-linked problems.
        """
        np.random.seed(42)

        # Accuracy [0.0, 1.0]
        accuracy = np.random.beta(a=2, b=2, size=n_samples)
        # Recent accuracy slightly correlated with overall
        recent_accuracy = np.clip(accuracy + np.random.normal(0, 0.15, size=n_samples), 0.0, 1.0)
        # Confidence [0.0, 1.0]
        confidence = np.random.uniform(0.2, 1.0, size=n_samples)
        # Gap = confidence - accuracy
        gap = confidence - accuracy
        # Response time in seconds (confused students often take longer or guess quickly)
        response_time = np.random.gamma(shape=3.0, scale=8.0, size=n_samples) # mean ~24s
        # Repeated errors [0 to 6]
        repeated_errors = np.random.poisson(lam=1.5 * (1.0 - accuracy), size=n_samples)
        # Prerequisite score [0.0, 1.0]
        prereq_score = np.clip(accuracy * 0.7 + np.random.uniform(0.0, 0.4, size=n_samples), 0.0, 1.0)
        # Attempt count
        attempts = np.random.randint(2, 15, size=n_samples)

        # Ground truth confusion probability formula based on educational literature
        # Confusion is higher when accuracy is low, repeated errors are high, prereq is weak, and confidence gap is high
        confusion_latent = (
            (1.0 - accuracy) * 0.40 +
            (1.0 - prereq_score) * 0.25 +
            np.clip(repeated_errors / 4.0, 0, 1) * 0.20 +
            np.clip(gap, 0, 1) * 0.15 +
            np.random.normal(0, 0.08, size=n_samples)
        )
        
        is_confused = (confusion_latent > 0.48).astype(int)

        df = pd.DataFrame({
            "accuracy": accuracy,
            "recent_accuracy": recent_accuracy,
            "average_confidence": confidence,
            "confidence_accuracy_gap": gap,
            "average_response_time": response_time,
            "repeated_error_count": repeated_errors,
            "prerequisite_score": prereq_score,
            "attempt_count": attempts,
            "is_confused": is_confused
        })
        return df

    def train_models(self):
        """Trains Logistic Regression and Random Forest models and evaluates metrics."""
        df = self._generate_synthetic_data(n_samples=1500)
        X = df[FEATURE_NAMES]
        y = df["is_confused"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

        # 1. Logistic Regression
        lr = LogisticRegression(max_iter=1000, random_state=42)
        lr.fit(X_train, y_train)
        y_pred_lr = lr.predict(X_test)
        
        self.metrics["logistic_regression"] = {
            "accuracy": round(float(accuracy_score(y_test, y_pred_lr)), 4),
            "precision": round(float(precision_score(y_test, y_pred_lr)), 4),
            "recall": round(float(recall_score(y_test, y_pred_lr)), 4),
            "f1": round(float(f1_score(y_test, y_pred_lr)), 4),
        }
        self.lr_model = lr
        joblib.dump(lr, self.lr_model_path)

        # 2. Random Forest
        rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
        rf.fit(X_train, y_train)
        y_pred_rf = rf.predict(X_test)

        self.metrics["random_forest"] = {
            "accuracy": round(float(accuracy_score(y_test, y_pred_rf)), 4),
            "precision": round(float(precision_score(y_test, y_pred_rf)), 4),
            "recall": round(float(recall_score(y_test, y_pred_rf)), 4),
            "f1": round(float(f1_score(y_test, y_pred_rf)), 4),
        }
        self.rf_model = rf
        joblib.dump(rf, self.rf_model_path)

    def _load_or_train(self):
        try:
            if os.path.exists(self.lr_model_path) and os.path.exists(self.rf_model_path):
                self.lr_model = joblib.load(self.lr_model_path)
                self.rf_model = joblib.load(self.rf_model_path)
            else:
                self.train_models()
        except Exception:
            self.train_models()

    def predict_confusion(self, features_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Takes raw concept feature metrics and returns confusion probability and explainability factors.
        """
        if self.lr_model is None or self.rf_model is None:
            self.train_models()

        X = pd.DataFrame([[features_dict.get(feat, 0.0) for feat in FEATURE_NAMES]], columns=FEATURE_NAMES)

        # Get probabilities
        lr_prob = float(self.lr_model.predict_proba(X)[0][1])
        rf_prob = float(self.rf_model.predict_proba(X)[0][1])

        # Ensemble weighted probability
        ensemble_prob = round((0.4 * lr_prob + 0.6 * rf_prob), 3)

        # Calculate feature contributions for explainability
        # Using Random Forest feature importances scaled by input deviations
        importances = self.rf_model.feature_importances_
        contributions = []

        feature_labels = {
            "repeated_error_count": "Repeated mistakes",
            "accuracy": "Low accuracy",
            "prerequisite_score": "Prerequisite weakness",
            "confidence_accuracy_gap": "Confidence mismatch",
            "recent_accuracy": "Recent decline",
            "average_confidence": "Misplaced confidence",
            "average_response_time": "Response hesitation",
            "attempt_count": "Practice volume",
        }

        for idx, feat in enumerate(FEATURE_NAMES):
            val = features_dict.get(feat, 0.0)
            imp = importances[idx]
            
            # Impact level determination
            if feat in ["accuracy", "recent_accuracy"] and val < 0.5:
                level = "High" if val < 0.4 else "Medium"
            elif feat == "repeated_error_count" and val >= 2:
                level = "High" if val >= 3 else "Medium"
            elif feat == "prerequisite_score" and val < 0.6:
                level = "High" if val < 0.45 else "Medium"
            elif feat == "confidence_accuracy_gap" and val > 0.25:
                level = "Medium"
            else:
                level = "Low"

            contributions.append({
                "feature": feat,
                "label": feature_labels.get(feat, feat),
                "importance": round(float(imp), 3),
                "value": round(float(val), 2),
                "impact_level": level
            })

        # Sort contributions by importance descending
        contributions.sort(key=lambda c: (c["impact_level"] == "High", c["impact_level"] == "Medium", c["importance"]), reverse=True)

        return {
            "confusion_probability": ensemble_prob,
            "logistic_regression_prob": round(lr_prob, 3),
            "random_forest_prob": round(rf_prob, 3),
            "contributing_factors": contributions[:4],
            "model_metrics": self.metrics
        }


# Singleton instance
confusion_predictor = ConfusionPredictor()
