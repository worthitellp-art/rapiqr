  


Rules of genreating the sheet for the stickers 

 - must selection based do not direct collect
 -Widht-4inch
Hight-2.5 inch this si the sticker size of the single sticker 
- always give in pdf with possiible storage area inside the pdf use the all space and no chnage sticker size that type of logic 
- user can genreate bulk prints in single pdf like 50 sheets in single pdf or less sheet and 50 stickers , user can put 50 sticker genreate then it will automaticlly align in pdf and genreeate 1 pdf with recovery codes inside pdf 



  
  
  remove option to delete the sticker if you want to delete the sticker request to the super admin , super admin can delete but 1 by 1 not all and it wills how popup for confirmation , 


  only 2 view mod in admin pannel inside qr codes tab , 

  reduce radius redesign the admin pannel commponenets make godd ui feels good , remove top side top bar from admin pannel , 

 
  remove delete all button  / cear all button remove from it .





super admin :- 


Act as a Senior Cybersecurity Architect and Full-Stack Engineer. I need you to write the backend code and database schema to implement a "Super Admin" role for my web application. 

The application uses Email and Password for authentication. I want this system hardened against hackers using industry-standard security practices.

Please provide the code and logic for the following 4 components:

1. DATABASE SCHEMA
Create a users table/schema that includes fields for:
- Standard user details (Id, email, hashed_password)
- A role field (Enum: 'user', 'admin', 'super_admin')
- Security columns: multi_factor_secret, last_login_ip, account_locked_until, login_attempts, and a unique backup_recovery_code.

2. SECURE REGISTRATION & SEEDING SCRIPT
Write a script or backend function to safely seed/create the initial Super Admin. 
- Ensure it enforces a strong password policy (minimum 16 characters, checks for complexity).
- Include standard password hashing logic using Argon2id or bcrypt.

3. HARDENED LOGIN LOGIC & MIDDLEWARE
Write the authentication and authorization backend logic for logging in. It must include:
- Brute-force protection: Lock the account for 15 minutes after 5 failed login attempts.
- An "IsSuperAdmin" middleware/decorator to restrict access to sensitive management routes.
- IP logging to track where the Super Admin is accessing the system from.

4. DUAL-AUTHORIZATION TRIGGER (SECURITY BONUS)
Include a mechanism or middleware that sends a mock security alert (e.g., logging a critical warning or triggering a webhook notification) the exact second a 'super_admin' successfully logs in, so the team is immediately aware.

Please write this using [INSERT YOUR CHOSEN LANGUAGE/FRAMEWORK HERE, e.g., Node.js with Express and PostgreSQL, or Python with FastAPI and SQLAlchemy]. Keep the code clean, fully commented, and production-ready.

