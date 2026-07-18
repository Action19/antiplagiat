const pool = require('./database');

const migrate = async () => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        original_filename VARCHAR(500),
        file_path VARCHAR(1000),
        content TEXT NOT NULL,
        word_count INTEGER DEFAULT 0,
        file_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        chunk_text TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        fingerprint VARCHAR(64),
        shingles TEXT[],
        minhash_signature INTEGER[],
        tfidf_vector JSONB
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS check_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        overall_score DECIMAL(5,2) NOT NULL DEFAULT 0,
        originality_score DECIMAL(5,2) NOT NULL DEFAULT 100,
        ai_score DECIMAL(5,2) DEFAULT 0,
        shingling_score DECIMAL(5,2) DEFAULT 0,
        minhash_score DECIMAL(5,2) DEFAULT 0,
        tfidf_score DECIMAL(5,2) DEFAULT 0,
        fingerprint_score DECIMAL(5,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        report_path VARCHAR(1000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS plagiarism_matches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        check_result_id UUID REFERENCES check_results(id) ON DELETE CASCADE,
        source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
        source_url VARCHAR(2000),
        source_title VARCHAR(500),
        matched_text TEXT NOT NULL,
        original_text TEXT,
        start_position INTEGER NOT NULL,
        end_position INTEGER NOT NULL,
        similarity_score DECIMAL(5,2) NOT NULL,
        algorithm_used VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS web_sources_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        url VARCHAR(2000) UNIQUE NOT NULL,
        title VARCHAR(500),
        content TEXT,
        content_hash VARCHAR(64),
        last_fetched TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Barcha jadvallar muvaffaqiyatli yaratildi!');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await pool.query(`
      INSERT INTO users (email, password, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@antiplagiat.uz', hashedPassword, 'Administrator', 'admin']);

    console.log('Default admin yaratildi: admin@antiplagiat.uz / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Migration xatosi:', error);
    process.exit(1);
  }
};

migrate();
