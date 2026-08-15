CUSTOMER
                     │
               Scan RepiQR
                     │
                     ▼
         https://repiqr.com/qr/ABCD1234
                     │
                     ▼
              RepiQR Backend
                     │
      Validate QR + Find Owner
                     │
                     ▼
      Fetch Owner Mobile Number
                     │
                     ▼
        "Call Owner" Button Press
                     │
                     ▼
      POST /api/call/start
                     │
                     ▼
        RepiQR Call Service
                     │
          Generate Call Session
        Session ID: S123456
                     │
                     ▼
     CPaaS API (Knowlarity/Exotel)
                     │
     Allocate Virtual Number
      +91 80XXXX1234
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   Call Customer          Call Owner
 (Scanner Number)      (Registered Number)
          │                     │
          └──────────┬──────────┘
                     ▼
            Bridge Both Calls
                     │
                     ▼
            Two-way Conversation
                     │
                     ▼
         Call Ends → Session Closed
                     │
                     ▼
      Virtual Mapping Expires