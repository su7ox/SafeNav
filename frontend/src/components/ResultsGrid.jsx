import React from 'react';
import { ModuleCard } from './ModuleCard';
import './SafeNavResults.css';

export const ResultsGrid = ({ results }) => {
  if (!results || !results.details) return null;
  const d = results.details;

  // Helpers
  const truncate = (str, len) => str?.length > len ? str.substring(0, len) + '…' : str;
  const formatAge = (days) => {
    if (!days) return "Unknown";
    if (days < 365) return `${days} days`;
    const y = Math.floor(days / 365);
    const m = Math.floor((days % 365) / 30);
    return `${y} years ${m > 0 ? m + ' months' : ''}`;
  };

  // --- 1. SSL & Security ---
  const ssl = d.ssl_security || {};
  let sslPills = [...(ssl.warning_flags || [])];
  if (ssl.is_self_signed) sslPills.push("Self-Signed Certificate");

  const sslBadge = ssl.is_valid 
    ? { text: `${ssl.tls_version || 'TLS'} · ${ssl.key_type || 'Secure'}`, color: 'badge-green' }
    : { text: "⚠ Invalid", color: 'badge-red' };

  const sslFields = [
    { label: "Valid", value: ssl.is_valid, type: "boolean" },
    { label: "HTTPS", value: ssl.is_https, type: "boolean" },
    { label: "Issuer", value: truncate(ssl.issuer, 20) },
    { label: "TLS Version", value: ssl.tls_version },
    { label: "Cipher Suite", value: truncate(ssl.cipher_suite, 24) },
    { label: "Validation", value: ssl.validation_type },
    { label: "Expires In", value: ssl.days_to_expire ? `${ssl.days_to_expire} days` : null },
    { label: "Key", value: ssl.key_type ? `${ssl.key_type} ${ssl.key_bits ? ssl.key_bits + '-bit' : ''}` : null },
    { label: "HSTS", value: ssl.hsts_enabled, type: "boolean" },
    { label: "CT Log Entries", value: ssl.ct_log_count }
  ];

  // --- 2. Phishing Checks ---
  const phish = d.phishing_checks || {};
  const phishRisks = [phish.typosquatting, phish.brand_similarity, phish.suspicious_keywords, phish.homograph_attack]
    .some(v => v && v !== 'No' && v !== 'None' && v !== false);
    
  const phishBadge = phishRisks ? { text: "⚠ Risk Detected", color: 'badge-red' } : { text: "Clean", color: 'badge-green' };
  const phishFields = [
    { label: "Typosquatting", value: phish.typosquatting || 'No', type: "phishing" },
    { label: "Brand Similarity", value: phish.brand_similarity || 'None', type: "phishing" },
    { label: "Suspicious Keywords", value: phish.suspicious_keywords || 'None', type: "phishing" },
    { label: "Homograph Attack", value: phish.homograph_attack || 'No', type: "phishing" }
  ];

  // --- 3. Domain Reputation ---
  const rep = d.domain_reputation || {};
  const repBadge = { 
    text: `${rep.domain_age_days || '?'} days · ${rep.domain_age_days > 365 ? 'Established' : 'New'}`, 
    color: rep.domain_age_days > 365 ? 'badge-green' : 'badge-yellow' 
  };
  const repFields = [
    { label: "Domain Age", value: formatAge(rep.domain_age_days) },
    { label: "Domain Status", value: rep.domain_status },
    { label: "Suspicious TLD", value: rep.is_suspicious_tld, type: "boolean" },
    { label: "Registrar Trust", value: rep.registrar_trust },
    { label: "WHOIS Privacy", value: rep.whois_privacy, type: "boolean" }
  ];

  // --- 4. IP Intelligence ---
  const ip = d.ip_intelligence || {};
  const hostedIn = [ip.hosting_flag, ip.hosting_country, ip.hosting_city].filter(Boolean).join(' · ');
  const asnInfo = [ip.asn, ip.asn_org].filter(Boolean).join(' · ');
  const regIn = [ip.registrant_flag, ip.registrant_country].filter(Boolean).join(' ');

  const ipBadge = { text: `${ip.hosting_flag || ''} ${ip.hosting_city || ''} · ${ip.asn || ''}`, color: 'badge-neutral' };
  const ipFields = [
    { label: "IP Address", value: ip.ip_address },
    { label: "Hosted In", value: hostedIn },
    { label: "ISP", value: ip.isp },
    { label: "ASN", value: asnInfo },
    { label: "VPN / Proxy", value: ip.is_vpn_or_proxy, type: "boolean" },
    { label: "Registered In", value: regIn },
    { label: "Registrar", value: ip.registrar },
    { label: "Reg. Date", value: ip.registration_date },
    { label: "Country Mismatch", value: ip.country_mismatch, type: "boolean" }
  ];

  // --- 5. Link Structure ---
  const link = d.link_structure || {};
  const linkBadge = { text: `${link.original_domain || 'Unknown'} · Standard`, color: 'badge-neutral' };
  const linkFields = [
    { label: "Platform", value: link.platform },
    { label: "Service Type", value: link.service_type },
    { label: "Link Category", value: link.link_category },
    { label: "Original Domain", value: link.original_domain },
    { label: "Is IP Based", value: link.is_ip_based, type: "boolean" },
    { label: "Obfuscation", value: link.obfuscation }
  ];
  if (link.short_provider && link.short_provider !== "None") {
    linkFields.splice(2, 0, { label: "Short Provider", value: link.short_provider });
  }

  // --- 6. Redirect Analysis ---
  const redir = d.redirect_analysis || {};
  const hops = redir.hop_count || 0;
  const redirBadge = hops === 0 ? { text: "0 hops · Clean", color: 'badge-green' } : { text: `⚠ ${hops} hops`, color: 'badge-yellow' };
  const redirFields = [
    { label: "Hops", value: hops },
    { label: "Cross Domain", value: redir.cross_domain, type: "boolean" },
    { label: "Final Destination", value: redir.final_destination, type: "url" },
    { label: "Redirect Loop", value: redir.redirect_loop, type: "boolean" }
  ];

  return (
    <div className="results-grid">
      <ModuleCard title="SSL & Security" icon="🔐" statusBadge={sslBadge} fields={sslFields} warningFlags={sslPills} />
      <ModuleCard title="Phishing Checks" icon="🎣" statusBadge={phishBadge} fields={phishFields} />
      <ModuleCard title="Domain Reputation" icon="🌐" statusBadge={repBadge} fields={repFields} />
      <ModuleCard title="IP Intelligence" icon="🌍" statusBadge={ipBadge} fields={ipFields} warningFlags={ip.warning_flags} />
      <ModuleCard title="Link Structure" icon="🔗" statusBadge={linkBadge} fields={linkFields} />
      <ModuleCard title="Redirect Analysis" icon="🔄" statusBadge={redirBadge} fields={redirFields} />
    </div>
  );
};