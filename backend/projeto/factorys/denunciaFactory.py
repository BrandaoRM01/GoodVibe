from projeto.models import Denuncia

class DenunciaFactory:
    @staticmethod
    def criar_denuncia(**campos):
        return Denuncia(**campos)