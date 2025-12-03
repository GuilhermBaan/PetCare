import sqlite3

def fix_enum_data():
    conn = sqlite3.connect('clinica_vet.db')
    cur = conn.cursor()
    try:
        # consultas -> minúsculo
        cur.execute("UPDATE consultas SET status = 'agendada'     WHERE status IN ('AGENDADA','Agendada')")
        cur.execute("UPDATE consultas SET status = 'concluida'    WHERE status IN ('CONCLUIDA','Concluida')")
        cur.execute("UPDATE consultas SET status = 'cancelada'    WHERE status IN ('CANCELADA','Cancelada')")
        cur.execute("UPDATE consultas SET status = 'em_andamento' WHERE status IN ('EM_ANDAMENTO','Em_Andamento','Em Andamento')")

        # banho_tosa -> minúsculo (tabela existe?)
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='banho_tosa'")
        if cur.fetchone():
            cur.execute("UPDATE banho_tosa SET status = 'agendado'     WHERE status IN ('AGENDADO','Agendado')")
            cur.execute("UPDATE banho_tosa SET status = 'concluido'    WHERE status IN ('CONCLUIDO','Concluido')")
            cur.execute("UPDATE banho_tosa SET status = 'cancelado'    WHERE status IN ('CANCELADO','Cancelado')")
            cur.execute("UPDATE banho_tosa SET status = 'em_andamento' WHERE status IN ('EM_ANDAMENTO','Em_Andamento','Em Andamento')")

            cur.execute("UPDATE banho_tosa SET tipo_servico = 'banho'          WHERE tipo_servico IN ('BANHO','Banho')")
            cur.execute("UPDATE banho_tosa SET tipo_servico = 'tosa'           WHERE tipo_servico IN ('TOSA','Tosa')")
            cur.execute("UPDATE banho_tosa SET tipo_servico = 'banho_e_tosa'   WHERE tipo_servico IN ('BANHO_E_TOSA','Banho_e_Tosa','Banho e Tosa')")

        conn.commit()
        print("Enums normalizados para minúsculo com sucesso.")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_enum_data()
