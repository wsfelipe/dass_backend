-- camisetas

CREATE TABLE shirt_sizes (
  id    SMALLINT    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code  VARCHAR(2)  NOT NULL,
  CONSTRAINT shirt_sizes_code_unique UNIQUE (code)
);

-- calcados

CREATE TABLE shoe_sizes (
  id    SMALLINT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  size  SMALLINT  NOT NULL,
  CONSTRAINT shoe_sizes_size_unique UNIQUE (size)
);

-- funcionarios

CREATE TABLE employees (
  id             SERIAL        PRIMARY KEY,
  cpf            VARCHAR(11)   NOT NULL,
  name           VARCHAR(120)  NOT NULL,
  email          VARCHAR(160)  NOT NULL,
  shirt_size_id  SMALLINT      NOT NULL,
  shoe_size_id   SMALLINT      NOT NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT employees_cpf_unique   UNIQUE (cpf),
  CONSTRAINT employees_email_unique UNIQUE (email),
  CONSTRAINT employees_shirt_size_fk FOREIGN KEY (shirt_size_id)
    REFERENCES shirt_sizes (id) ON DELETE RESTRICT,
  CONSTRAINT employees_shoe_size_fk FOREIGN KEY (shoe_size_id)
    REFERENCES shoe_sizes (id) ON DELETE RESTRICT
);

CREATE INDEX employees_shirt_size_id_idx ON employees (shirt_size_id);
CREATE INDEX employees_shoe_size_id_idx  ON employees (shoe_size_id);

-- inserts

INSERT INTO shirt_sizes (code) VALUES ('PP'), ('P'), ('M'), ('G'), ('GG'), ('XG');
INSERT INTO shoe_sizes (size) SELECT generate_series(34, 48);