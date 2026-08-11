import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { EventRoles } from "../security/decorators/roles.decorator";
import { EventRoleGuard } from "../security/guards/event-role.guard";
import { AtualizarListaOffGrupoDto, AtualizarPessoaListaOffDto, CriarListaOffGrupoDto, ImportarPessoasListaOffDto } from "./dto/lista-off.dto";
import { GuestlistService } from "./guestlist.service";

const PAPEIS_LEITURA = ["owner", "gestor", "view", "checkin_operator"] as const;
const PAPEIS_EDICAO = ["owner", "gestor"] as const;
const PAPEIS_CHECKIN = ["owner", "gestor", "checkin_operator"] as const;

@Controller("events/:id/listas-off")
@UseGuards(EventRoleGuard)
export class GuestlistController {
  constructor(private readonly guestlistService: GuestlistService) {}

  @Get()
  @EventRoles(...PAPEIS_LEITURA)
  listarListas(@Param("id") eventoId: string) {
    return this.guestlistService.listarListas(eventoId);
  }

  @Post()
  @EventRoles(...PAPEIS_EDICAO)
  criarLista(@Param("id") eventoId: string, @Body() dto: CriarListaOffGrupoDto) {
    return this.guestlistService.criarLista(eventoId, dto);
  }

  @Patch(":listaId")
  @EventRoles(...PAPEIS_EDICAO)
  atualizarLista(@Param("id") eventoId: string, @Param("listaId") listaId: string, @Body() dto: AtualizarListaOffGrupoDto) {
    return this.guestlistService.atualizarLista(eventoId, listaId, dto);
  }

  @Delete(":listaId")
  @EventRoles(...PAPEIS_EDICAO)
  removerLista(@Param("id") eventoId: string, @Param("listaId") listaId: string) {
    return this.guestlistService.removerLista(eventoId, listaId);
  }

  @Post(":listaId/pessoas/importar")
  @EventRoles(...PAPEIS_EDICAO)
  importarPessoas(@Param("id") eventoId: string, @Param("listaId") listaId: string, @Body() dto: ImportarPessoasListaOffDto) {
    return this.guestlistService.importarPessoas(eventoId, listaId, dto.conteudo);
  }

  @Get(":listaId/pessoas")
  @EventRoles(...PAPEIS_LEITURA)
  listarPessoas(
    @Param("id") eventoId: string,
    @Param("listaId") listaId: string,
    @Query("nome") nome = "",
    @Query("cpf") cpf = "",
    @Query("pagina") pagina = "1",
    @Query("limite") limite = "20",
  ) {
    return this.guestlistService.listarPessoas(eventoId, listaId, { nome, cpf, pagina: Number(pagina), limite: Number(limite) });
  }

  @Patch(":listaId/pessoas/:pessoaId")
  @EventRoles(...PAPEIS_EDICAO)
  atualizarPessoa(
    @Param("id") eventoId: string,
    @Param("listaId") listaId: string,
    @Param("pessoaId") pessoaId: string,
    @Body() dto: AtualizarPessoaListaOffDto,
  ) {
    return this.guestlistService.atualizarPessoa(eventoId, listaId, pessoaId, dto);
  }

  @Delete(":listaId/pessoas/:pessoaId")
  @EventRoles(...PAPEIS_EDICAO)
  removerPessoa(@Param("id") eventoId: string, @Param("listaId") listaId: string, @Param("pessoaId") pessoaId: string) {
    return this.guestlistService.removerPessoa(eventoId, listaId, pessoaId);
  }

  @Post(":listaId/pessoas/:pessoaId/checkin")
  @EventRoles(...PAPEIS_CHECKIN)
  fazerCheckin(@Param("id") eventoId: string, @Param("listaId") listaId: string, @Param("pessoaId") pessoaId: string) {
    return this.guestlistService.fazerCheckin(eventoId, listaId, pessoaId);
  }
}
