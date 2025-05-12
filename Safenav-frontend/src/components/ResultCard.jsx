import React from "react";

const ResultCard = ({ result }) => {
  const getColor = (verdict) => {
    if (verdict === "Safe") return "green";
    if (verdict === "Suspicious") return "orange";
    if (verdict === "Dangerous") return "red";
    return "black";
  };

  return (
    <div className="result-card">
      <h2>Result</h2>
      <p>
        <strong>SSL Score:</strong> {result.sslScore}
      </p>
      <p>
        <strong>Phishing Score:</strong> {result.phishingScore}
      </p>
      <p>
        <strong>Domain Reputation:</strong> {result.domainFlag ? "Bad" : "Good"}
      </p>
      <h3 style={{ color: getColor(result.verdict) }}>
        Final Verdict: {result.verdict}
      </h3>
    </div>
  );
};

export default ResultCard;
