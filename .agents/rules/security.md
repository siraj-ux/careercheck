---
trigger: always_on
---

# Security and privacy rules
- Many users are under 18. Minimise data collected and never log phone numbers,
  OTPs or test answers.
- Never send locked (paid) report data to free users. Gate on the server.
- Never expose correct answer keys to the client.
- Rate-limit OTP, login and payment endpoints.
- Consultants can only access students assigned to them.
- Secrets live only in environment variables. Never commit them.
- Validate every input with Zod on the server.