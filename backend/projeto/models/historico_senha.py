class HistoricoSenha:

    def __init__(self, usuario, senha_hash, criado_em=None):
        self.__usuario = usuario
        self.__senha_hash = senha_hash
        self.__criado_em = criado_em

    @property
    def usuario(self):
        return self.__usuario

    @property
    def senha_hash(self):
        return self.__senha_hash

    @property
    def criado_em(self):
        return self.__criado_em