-- Add per-question tracking to brand_phases
ALTER TABLE brand_phases
ADD COLUMN current_question_index integer NOT NULL DEFAULT 0;
