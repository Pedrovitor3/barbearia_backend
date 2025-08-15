import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('avaliacoes')
export class Avaliacao {
    @PrimaryGeneratedColumn({ name: 'avaliacao_id' })
    avaliacaoId!: number;

    @Column({ name: 'agendamento_id' })
    agendamentoId!: number;

    @Column({ name: 'cliente_id' })
    clienteId!: number;

    @Column({ name: 'funcionario_id' })
    funcionarioId!: number;

    @Column({ name: 'servico_id' })
    servicoId!: number;

    @Column({ type: 'int' })
    nota!: number;

    @Column({ type: 'text', nullable: true })
    comentario?: string;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
