import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notificacoes')
export class Notificacao {
    @PrimaryGeneratedColumn({ name: 'notificacao_id' })
    notificacaoId!: number;

    @Column({ name: 'usuario_id' })
    usuarioId!: number;

    @Column({ name: 'agendamento_id' })
    agendamentoId!: number;

    @Column({ length: 50 })
    tipo!: string;

    @Column({ length: 255 })
    titulo!: string;

    @Column({ type: 'text', nullable: true })
    mensagem?: string;

    @Column({ name: 'enviado_em', type: 'timestamp', nullable: true })
    enviadoEm?: Date;

    @Column({ default: false })
    lido!: boolean;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
