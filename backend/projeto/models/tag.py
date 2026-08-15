class Tag:
    def __init__(self, id, nome):
        self.__id = id
        self.__nome = nome

    @property
    def id(self):
        return self.__id

    @property
    def nome(self):
        return self.__nome

    def to_dict(self):
        return {
            'id': self.__id,
            'nome': self.__nome
        }