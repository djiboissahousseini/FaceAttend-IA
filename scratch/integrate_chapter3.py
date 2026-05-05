import os
from docx import Document
from docx.shared import Inches

def integrate_presentation(report_path):
    print(f"Tentative d'intégration de la section III dans : {report_path}")
    
    if not os.path.exists(report_path):
        print(f"Erreur : Le fichier {report_path} n'existe pas.")
        return

    try:
        doc = Document(report_path)
        
        doc.add_page_break()
        doc.add_heading("III. PRESENTATION DE L'APPLICATION", level=1)
        doc.add_heading("III.1 Modélisation et conception", level=2)
        
        # A. UML
        doc.add_heading("A. UML", level=3)
        doc.add_paragraph(
            "Le langage UML (Unified Modeling Language) est utilisé dans ce projet pour représenter "
            "le système de gestion d'absences et ses différents composants de manière standardisée "
            "et visuelle. Il permet de modéliser les processus métiers, les interactions entre les "
            "différents acteurs (administrateurs, enseignants, étudiants) et l'architecture globale "
            "de l'application."
        )

        # B. Diagramme de cas d'utilisation
        doc.add_heading("B. Diagramme de cas d'utilisation", level=3)
        doc.add_paragraph(
            "Ces diagrammes présentent les interactions principales entre les acteurs et le système. "
            "L'administrateur gère le système de bout en bout, l'enseignant consulte les absences "
            "et pilote les séances, tandis que l'étudiant consulte sa situation. Le système lui-même "
            "intervient en tant qu'acteur autonome pour reconnaître automatiquement les visages via "
            "l'intelligence artificielle."
        )
        
        uc_dir = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation"
        uc_files = [
            ("uc_admin_utilisateurs.png", "Cas d'utilisation : Administration des utilisateurs"),
            ("uc_admin_entites_operations.png", "Cas d'utilisation : Opérations critiques (Gestion)"),
            ("uc_enseignant_final.png", "Cas d'utilisation : Enseignant"),
            ("uc_etudiant_final.png", "Cas d'utilisation : Étudiant"),
            ("uc_camera_ia.png", "Cas d'utilisation : Reconnaissance faciale (Système)")
        ]
        
        for filename, caption in uc_files:
            path = os.path.join(uc_dir, filename)
            if os.path.exists(path):
                doc.add_picture(path, width=Inches(6))
                p = doc.add_paragraph()
                p.add_run(f"Figure : {caption}").bold = True
                p.alignment = 1

        # C. Diagrammes de séquence
        doc.add_page_break()
        doc.add_heading("C. Diagrammes de séquence", level=3)
        doc.add_paragraph(
            "Les diagrammes de séquence décrivent le déroulement des actions dans le temps pour "
            "les opérations clés. Par exemple, lors de l'émargement, la caméra capture le visage "
            "de l'étudiant, le système analyse l'image via FaceNet pour vérifier la vivacité "
            "(anti-spoofing), identifie l'étudiant dans la base de données, et enregistre "
            "automatiquement sa présence."
        )
        
        seq_dir = "/home/usain/Bureau/FaceAttend/docs/diagrams/sequences_detaillees"
        seq_files = [
            ("seq_creer_seance.png", "Séquence : Création et ouverture d'une séance"),
            ("seq_ajouter.png", "Séquence : Ajout d'un utilisateur et enrôlement facial"),
            ("seq_rechercher.png", "Séquence : Recherche d'informations"),
            ("seq_modifier.png", "Séquence : Modification des données"),
            ("seq_supprimer.png", "Séquence : Suppression sécurisée")
        ]
        
        for filename, caption in seq_files:
            path = os.path.join(seq_dir, filename)
            if os.path.exists(path):
                doc.add_picture(path, width=Inches(6))
                p = doc.add_paragraph()
                p.add_run(f"Figure : {caption}").bold = True
                p.alignment = 1

        # D. Diagramme de classes
        doc.add_page_break()
        doc.add_heading("D. Diagramme de classes", level=3)
        doc.add_paragraph(
            "Le diagramme de classes présente la structure de données et les relations entre "
            "les différentes entités du système. Il met en évidence les classes principales "
            "telles que l'utilisateur (administrateur), l'étudiant, l'enseignant, la séance, "
            "le record de présence/absence, l'alerte d'absence, et le module de reconnaissance "
            "faciale (IA)."
        )
        
        class_diag = "/home/usain/Bureau/FaceAttend/docs/diagrams/conception/diagramme_classe.png"
        if os.path.exists(class_diag):
            doc.add_picture(class_diag, width=Inches(6))
            p = doc.add_paragraph()
            p.add_run("Figure : Diagramme de classes du système FaceAttend").bold = True
            p.alignment = 1

        # E. Analyse fonctionnelle et non fonctionnelle
        doc.add_page_break()
        doc.add_heading("E. Analyse fonctionnelle et non fonctionnelle", level=3)
        
        # Exigences fonctionnelles
        p_func = doc.add_paragraph()
        p_func.add_run("Exigences fonctionnelles").bold = True
        doc.add_paragraph("Le système a été conçu pour répondre aux besoins suivants :")
        req_func = [
            "Capturer le visage de l'étudiant en temps réel via une caméra en salle.",
            "Analyser l'image pour vérifier la présence humaine (anti-spoofing).",
            "Identifier l'étudiant de manière unique par extraction de caractéristiques biométriques (FaceNet).",
            "Enregistrer automatiquement la présence de l'étudiant dans la base de données liée à la séance en cours.",
            "Permettre à l'enseignant de consulter, valider et modifier les absences de ses étudiants.",
            "Permettre à l'étudiant d'accéder à son espace pour consulter le récapitulatif de ses absences par matière."
        ]
        for req in req_func:
            doc.add_paragraph(f"• {req}")
            
        doc.add_paragraph()
        
        # Exigences non fonctionnelles
        p_non_func = doc.add_paragraph()
        p_non_func.add_run("Exigences non fonctionnelles").bold = True
        doc.add_paragraph("Pour garantir une qualité de service optimale, le système doit satisfaire les critères suivants :")
        req_non_func = [
            "Rapidité : L'identification et l'enregistrement de la présence doivent se faire en une fraction de seconde pour éviter les files d'attente.",
            "Sécurité : Les données biométriques (vecteurs faciaux) et personnelles doivent être protégées et inaccessibles aux personnes non autorisées.",
            "Fiabilité : Le système doit minimiser les faux positifs et faux négatifs, tout en détectant les tentatives de fraude (photos, vidéos).",
            "Facilité d'utilisation (Ergonomie) : Les interfaces doivent être intuitives pour tous les acteurs, sans nécessité de formation technique.",
            "Précision de reconnaissance faciale : L'algorithme d'IA doit offrir un haut taux d'exactitude même avec des variations d'éclairage ou de pose."
        ]
        for req in req_non_func:
            doc.add_paragraph(f"• {req}")

        doc.save(report_path)
        print("Mise à jour réussie : Le chapitre III complet a été ajouté au document !")

    except Exception as e:
        print(f"Erreur lors de l'intégration : {e}")

if __name__ == "__main__":
    path = "/home/usain/Téléchargements/PCF de Application de gestion des absences basée sur la reconnaissance faciale.docx"
    integrate_presentation(path)
