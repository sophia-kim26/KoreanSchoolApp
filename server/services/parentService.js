import { sql } from '../config/database.js';

// Get parent by ID
export const getParentById = async (parentId) => {
  try {
    const result = await sql`
      SELECT id, english_name, korean_name, phone, email 
      FROM parent_list 
      WHERE id = ${parentId}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching parent by ID:', error);
    throw error;
  }
};

// Get both parents for a TA
export const getParentsByTAId = async (taId) => {
  try {
    const result = await sql`
      SELECT 
        p1.id as parent1_id,
        p1.english_name as parent1_english_name,
        p1.korean_name as parent1_korean_name,
        p1.phone as parent1_phone,
        p1.email as parent1_email,
        p2.id as parent2_id,
        p2.english_name as parent2_english_name,
        p2.korean_name as parent2_korean_name,
        p2.phone as parent2_phone,
        p2.email as parent2_email
      FROM ta_list ta
      LEFT JOIN parent_list p1 ON ta.parent_1_id = p1.id
      LEFT JOIN parent_list p2 ON ta.parent_2_id = p2.id
      WHERE ta.id = ${taId}
    `;
    
    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    
    // Format the response as an array of parent objects
    const parents = [];
    
    if (row.parent1_id) {
      parents.push({
        id: row.parent1_id,
        englishName: row.parent1_english_name,
        koreanName: row.parent1_korean_name,
        phone: row.parent1_phone,
        email: row.parent1_email
      });
    }
    
    if (row.parent2_id) {
      parents.push({
        id: row.parent2_id,
        englishName: row.parent2_english_name,
        koreanName: row.parent2_korean_name,
        phone: row.parent2_phone,
        email: row.parent2_email
      });
    }
    
    return parents;
  } catch (error) {
    console.error('Error fetching parents by TA ID:', error);
    throw error;
  }
};

// Get all parents
export const getAllParents = async () => {
  try {
    const result = await sql`
      SELECT id, english_name, korean_name, phone, email 
      FROM parent_list
      ORDER BY id ASC
    `;
    return result;
  } catch (error) {
    console.error('Error fetching all parents:', error);
    throw error;
  }
};

// Create a new parent
export const createParent = async ({ english_name, korean_name, phone, email }) => {
  try {
    const result = await sql`
      INSERT INTO parent_list (english_name, korean_name, phone, email)
      VALUES (${english_name}, ${korean_name}, ${phone}, ${email})
      RETURNING id, english_name, korean_name, phone, email
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating parent:', error);
    throw error;
  }
};

// Update parent information
export const updateParent = async (id, { english_name, korean_name, phone, email }) => {
  try {
    const result = await sql`
      UPDATE parent_list
      SET 
        english_name = COALESCE(${english_name}, english_name),
        korean_name = COALESCE(${korean_name}, korean_name),
        phone = COALESCE(${phone}, phone),
        email = COALESCE(${email}, email)
      WHERE id = ${id}
      RETURNING id, english_name, korean_name, phone, email
    `;
    
    if (result.length === 0) {
      const error = new Error('Parent not found');
      error.status = 404;
      throw error;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error updating parent:', error);
    throw error;
  }
};

// Delete a parent
export const deleteParent = async (id) => {
  try {
    const result = await sql`
      DELETE FROM parent_list
      WHERE id = ${id}
      RETURNING id, english_name, korean_name, phone, email
    `;
    
    if (result.length === 0) {
      const error = new Error('Parent not found');
      error.status = 404;
      throw error;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error deleting parent:', error);
    throw error;
  }
}