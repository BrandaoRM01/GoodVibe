from projeto.models import Tag

class TagFactory:
    @staticmethod
    def criar_tag(id, nome):
        return Tag(id=id, nome=nome)