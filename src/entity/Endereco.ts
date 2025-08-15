import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('enderecos')
export class Endereco {
    @PrimaryGeneratedColumn({ name: 'endereco_id' })
    enderecoId!: number;

    @Column({ length: 10 })
    cep!: string;

    @Column({ length: 255 })
    logradouro!: string;

    @Column({ length: 10, nullable: true })
    numero?: string;

    @Column({ length: 100, nullable: true })
    complemento?: string;

    @Column({ length: 100 })
    bairro!: string;

    @Column({ length: 100 })
    cidade!: string;

    @Column({ length: 2 })
    estado!: string;

    @Column({ length: 50, default: 'Brasil' })
    pais!: string;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
