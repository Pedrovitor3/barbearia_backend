import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("pessoas")
export class Pessoa {
  @PrimaryGeneratedColumn({ name: "pessoa_id" })
  pessoaId!: number;

  @Column({ length: 11, unique: true, nullable: true })
  cpf?: string;

  @Column({ length: 255 })
  nome!: string;

  @Column({ length: 255 })
  sobrenome!: string;

  @Column({ type: "date", name: "data_nascimento", nullable: true })
  dataNascimento?: Date;

  @Column({ length: 1, nullable: true })
  sexo?: string;

  // Adicione este campo
  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({
    type: "timestamp",
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @Column({
    type: "timestamp",
    name: "updated_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  @Column({ type: "timestamp", name: "deleted_at", nullable: true })
  deletedAt?: Date;
}
