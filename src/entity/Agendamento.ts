import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('agendamentos')
export class Agendamento {
    @PrimaryGeneratedColumn({ name: 'agendamento_id' })
    agendamentoId!: number;

    @Column({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ name: 'cliente_id' })
    clienteId!: number;

    @Column({ name: 'funcionario_id' })
    funcionarioId!: number;

    @Column({ name: 'servico_id' })
    servicoId!: number;

    @Column({ name: 'data_agendamento', type: 'date' })
    dataAgendamento!: Date;

    @Column({ name: 'horario_inicio', type: 'time' })
    horarioInicio!: string;

    @Column({ name: 'horario_fim', type: 'time' })
    horarioFim!: string;

    @Column({ length: 20, default: 'agendado' })
    status!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    valor?: string;

    @Column({ type: 'text', nullable: true })
    observacoes?: string;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
