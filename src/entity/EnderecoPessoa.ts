import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('enderecos_pessoas')
export class EnderecoPessoa {
    @PrimaryGeneratedColumn({ name: 'endereco_pessoa_id' })
    enderecoPessoaId!: number;

    @Column({ name: 'pessoa_id' })
    pessoaId!: number;

    @Column({ name: 'endereco_id' })
    enderecoId!: number;

    @Column({ length: 20 })
    tipo!: 'casa';

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
