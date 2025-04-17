# Developer Guide - Climatomètre BUT1 R&T

## Project Architecture

### File Structure
```
Merge2/
├── php/              # Backend PHP
│   ├── sync.php      # Data synchronization
│   ├── login.php     # Authentication management
│   ├── admin.php     # Administration interface
│   └── database.sql  # Database schema
├── js/               # Frontend JavaScript
│   ├── main.js       # Main logic
│   └── weather.js    # Weather data management
├── scripts/          # Utility scripts
│   ├── auth.js       # Authentication
│   ├── redirect.js   # Redirection
│   ├── admin.js      # Administration
│   └── weather.js    # Weather
└── data/             # Data
    └── students.json # Student data
```

## Environment Setup

### Prerequisites
- PHP 7.4+
- MySQL 5.7+
- Node.js 14+
- Web server (Apache/Nginx)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the database:
   ```bash
   mysql -u root -p < php/database.sql
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

## Development

### Backend (PHP)
- Using PDO for database operations
- RESTful API for frontend/backend communications
- Session management for authentication

### Frontend (JavaScript)
- Modular architecture
- Using Fetch API for requests
- State management with JavaScript objects

### Database
Main structure:
```sql
-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    name VARCHAR(255),
    role ENUM('student', 'admin'),
    group_id INT
);

-- Groups table
CREATE TABLE groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT
);

-- Residences table
CREATE TABLE residences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    city VARCHAR(255),
    start_date DATE,
    end_date DATE,
    type ENUM('main', 'secondary', 'other')
);
```

## API

### Endpoints
- `/api/login` - Authentication
- `/api/users` - User management
- `/api/groups` - Group management
- `/api/weather` - Weather data

### Response Format
```json
{
    "status": "success|error",
    "data": {},
    "message": "Response description"
}
```

## Testing
1. Unit tests:
   ```bash
   npm test
   ```
2. Integration tests:
   ```bash
   php tests/integration.php
   ```

## Deployment
1. Build assets:
   ```bash
   npm run build
   ```
2. Configure the web server
3. Update the database
4. Check permissions

## Maintenance
- Error logging
- Regular database backup
- Dependency updates

## Contribution
1. Fork the project
2. Create a branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## Best Practices
- Follow code conventions
- Document your code
- Test before committing
- Use descriptive commit messages
