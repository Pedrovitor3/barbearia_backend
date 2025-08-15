import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('logs_atividades')
export class LogAtividade {
    @PrimaryGeneratedColumn({ name: 'log_id' })
    logId!: number;

    @Column({ name: 'usuario_id' })
    usuarioId!: number;

    @Column({ length: 100 })
    acao!: string;

    @Column({ name: 'tabela_afetada', length: 50, nullable: true })
    tabelaAfetada?: string;

    @Column({ name: 'registro_id', type: 'int', nullable: true })
    registroId?: number;

    @Column({ name: 'dados_anteriores', type: 'jsonb', nullable: true })
    dadosAnteriores?: object;

    @Column({ name: 'dados_novos', type: 'jsonb', nullable: true })
    dadosNovos?: object;

    @Column({ name: 'ip_address', type: 'inet', nullable: true })
    ipAddress?: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent?: string;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
}
