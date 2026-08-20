from abc import ABC, abstractmethod

class Usuario(ABC):

    def __init__(self, email, username, senha_hash=None, url_foto=None, token_recuperacao=None, token_expiracao=None, qtd_seguidores=0, qtd_seguindo=0, descricao_perfil=None, data_entrada=None, url_capa=None, localizacao=None):
        self.__email = email
        self.__senha_hash = senha_hash
        self.__url_foto = url_foto
        self.__username = username
        self.__token_recuperacao = token_recuperacao
        self.__token_expiracao = token_expiracao
        self.__qtd_seguidores = qtd_seguidores
        self.__qtd_seguindo = qtd_seguindo
        self.__descricao_perfil = descricao_perfil
        self.__data_entrada = data_entrada
        self.__localizacao = localizacao
        self.__url_capa = url_capa

    @property
    def email(self):
        return self.__email
    
    @property
    def senha_hash(self):
        return self.__senha_hash
    
    @property
    def url_foto(self):
        return self.__url_foto
    
    @property
    def username(self):
        return self.__username
     
    @property
    def token_recuperacao(self):
        return self.__token_recuperacao
    
    @property
    def token_expiracao(self):
        return self.__token_expiracao

    @property
    def qtd_seguidores(self):
        return self.__qtd_seguidores

    @property
    def qtd_seguindo(self):
        return self.__qtd_seguindo

    @property
    def descricao_perfil(self):
        return self.__descricao_perfil

    @property
    def data_entrada(self):
        return self.__data_entrada

    @property
    def url_capa(self):
        return self.__url_capa

    @property
    def localizacao(self):
        return self.__localizacao

    @localizacao.setter
    def localizacao(self, valor):
        self.__localizacao = valor

    @email.setter
    def email(self, valor):
        self.__email = valor

    @senha_hash.setter
    def senha_hash(self, valor):
        self.__senha_hash = valor

    @url_foto.setter
    def url_foto(self, valor):
        self.__url_foto = valor

    @username.setter
    def username(self, valor):
        self.__username = valor
 
    @token_recuperacao.setter
    def token_recuperacao(self, valor):
        self.__token_recuperacao = valor

    @token_expiracao.setter
    def token_expiracao(self, valor):
        self.__token_expiracao = valor

    @qtd_seguidores.setter
    def qtd_seguidores(self, valor):
        self.__qtd_seguidores = valor

    @qtd_seguindo.setter
    def qtd_seguindo(self, valor):
        self.__qtd_seguindo = valor

    @descricao_perfil.setter
    def descricao_perfil(self, valor):
        self.__descricao_perfil = valor

    @data_entrada.setter
    def data_entrada(self, valor):
        self.__data_entrada = valor

    @url_capa.setter
    def url_capa(self, valor):
        self.__url_capa = valor

    @abstractmethod
    def to_dict(self):
        pass
    
    @abstractmethod
    def tipo_usuario(self):
        pass

    @abstractmethod
    def pode_moderar(self):
        pass

    @abstractmethod
    def pode_gerenciar_usuarios(self):
        pass

from .user import User
from .admin import Admin
from .superadmin import Superadmin