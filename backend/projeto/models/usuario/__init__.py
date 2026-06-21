from abc import ABC, abstractmethod

class Usuario(ABC):

    def __init__(self, email, username, senha_hash=None, url_foto=None, token_recuperacao=None, token_expiracao=None):
        self.__email = email
        self.__senha_hash = senha_hash
        self.__url_foto = url_foto
        self.__username = username
        self.__token_recuperacao = token_recuperacao
        self.__token_expiracao = token_expiracao

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