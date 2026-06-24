package br.edu.ifg.trilhadeaprendizadoapims.user.service;

import br.edu.ifg.trilhadeaprendizadoapims.user.dto.AlunoDto;
import br.edu.ifg.trilhadeaprendizadoapims.user.dto.UsuarioCreateDto;
import br.edu.ifg.trilhadeaprendizadoapims.user.model.Aluno;
import br.edu.ifg.trilhadeaprendizadoapims.user.model.enums.Role;
import br.edu.ifg.trilhadeaprendizadoapims.user.repository.AlunoRepository;
import br.edu.ifg.trilhadeaprendizadoapims.user.util.Util;
import jakarta.persistence.EntityNotFoundException;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AlunoService implements UsuarioAbstractService<AlunoDto, UsuarioCreateDto> {

    @Autowired
    private AlunoRepository repository;
    @Autowired
    private ModelMapper modelMapper;

    @Override
    public AlunoDto buscarPorId(Long id) {
        Aluno entidade = repository.findById(id).orElseThrow( () -> new EntityNotFoundException());
        return modelMapper.map(entidade, AlunoDto.class);
    }

    @Override
    public UsuarioCreateDto buscarPorEmail(String email) {
        Aluno entidade = repository.findByEmail(email).orElseThrow(() -> new EntityNotFoundException());
        return modelMapper.map(entidade, UsuarioCreateDto.class);
    }

    @Override
    public AlunoDto atualizar(Long id, AlunoDto dto) {
        Aluno entidadeAntiga = repository.findById(id).orElseThrow( () -> new EntityNotFoundException());
        Aluno entidade = modelMapper.map(dto, Aluno.class);
        entidade.setId(id);
        entidade.setSenhaHash(entidadeAntiga.getSenhaHash());
        repository.save(entidade);

        return modelMapper.map(entidade, AlunoDto.class);
    }

    @Override
    public Page<AlunoDto> buscarTodos(Pageable paginacao) {
        return repository
                .findAll(paginacao)
                .map(entidade -> modelMapper.map(entidade, AlunoDto.class));
    }

    @Override
    public AlunoDto inserir(UsuarioCreateDto dto) {
        Aluno entidade = modelMapper.map(dto, Aluno.class);
        entidade.setDataCadastro(LocalDateTime.now());
        entidade.setXpTotal(0);
        entidade.setNivel(calcularNivelPorXp(entidade.getXpTotal()));
        
        entidade.setSenhaHash(Util.gerarHashMD5(dto.getSenha()));
        
        if (entidade.getRole() == null) {
            entidade.setRole(Role.ALUNO);
        }
        
        repository.save(entidade);

        return modelMapper.map(entidade, AlunoDto.class);
    }

    @Override
    public void excluir(Long id) {
        Aluno entidade = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado"));

        repository.deleteById(id);
    }
    
    public AlunoDto adicionarXp(Long id, int xpGanho) {
        Aluno entidade = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado"));
        
        entidade.setXpTotal(entidade.getXpTotal() + xpGanho);
        entidade.setNivel(calcularNivelPorXp(entidade.getXpTotal()));
        repository.save(entidade);
        
        return modelMapper.map(entidade, AlunoDto.class);
    }
    
    public AlunoDto recalcularXpTotal(Long id) {
        Aluno entidade = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado"));
        
        entidade.setXpTotal(0);
        entidade.setNivel(calcularNivelPorXp(entidade.getXpTotal()));
        repository.save(entidade);
        
        return modelMapper.map(entidade, AlunoDto.class);
    }
    private int calcularNivelPorXp(int xpTotal) {
        return Math.max(1, (xpTotal / 100) + 1);
    }
}
