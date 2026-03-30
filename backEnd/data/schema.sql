-- Схема базы данных для системы анкетирования DPLM
-- PostgreSQL

-- Таблица анкет (уже существует, дополняем)
-- questionnaire_data:
--   id, name, code, description, scope, status, created_at, updated_at

-- Таблица вопросов
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES questionnaire_data(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('open', 'closed', 'mixed', 'scale', 'dichotomous')),
    text TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    block_type VARCHAR(50) DEFAULT 'main' CHECK (block_type IN ('main', 'passport')),
    is_randomized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для вопросов
CREATE INDEX IF NOT EXISTS idx_questions_questionnaire_id ON questions(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_block_type ON questions(block_type);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(questionnaire_id, order_index);

-- Таблица вариантов ответов
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'no_answer', 'refuse', 'other', 'agree_disagree', 'like_dislike', 'custom')),
    text TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ответов
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_type ON answers(type);

-- Таблица для хранения ответов респондентов (на будущее)
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES survey_data(id) ON DELETE CASCADE,
    questionnaire_id UUID NOT NULL REFERENCES questionnaire_data(id) ON DELETE CASCADE,
    respondent_id UUID,
    city VARCHAR(255),
    region VARCHAR(255),
    district VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ответов респондентов
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_questionnaire_id ON responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);

-- Таблица для хранения ответов на вопросы (на будущее)
CREATE TABLE IF NOT EXISTS response_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
    text_value TEXT,
    numeric_value DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ответов на вопросы
CREATE INDEX IF NOT EXISTS idx_response_answers_response_id ON response_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_response_answers_question_id ON response_answers(question_id);

-- Комментарии к таблицам
COMMENT ON TABLE questions IS 'Вопросы анкет';
COMMENT ON COLUMN questions.type IS 'Тип вопроса: open - открытый, closed - закрытый, mixed - смешанный, scale - шкальный, dichotomous - дихотомический';
COMMENT ON COLUMN questions.block_type IS 'Тип блока: main - основной блок, passport - паспортная часть';

COMMENT ON TABLE answers IS 'Варианты ответов на вопросы';
COMMENT ON COLUMN answers.type IS 'Тип ответа: text - текстовый, no_answer - затрудняюсь ответить, refuse - отказываюсь отвечать, other - другое, agree_disagree - согласен/не согласен, like_dislike - нравится/не нравится, custom - пользовательский';

COMMENT ON TABLE responses IS 'Ответы респондентов на опросы';
COMMENT ON TABLE response_answers IS 'Конкретные ответы на вопросы в рамках опроса';
