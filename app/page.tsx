import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  GraduationCap, 
  MessageSquare, 
  BarChart, 
  Calendar, 
  LineChart,
  GraduationCap as GradeIcon
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-12 text-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              EduMeet
            </h1>
          </div>
          
          <p className="max-w-[700px] text-neutral-600 dark:text-neutral-400 md:text-xl">
            Une plateforme éducative moderne et complète. Connectez-vous, apprenez, et collaborez avec des outils puissants conçus pour l'apprentissage du 21e siècle.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <MessageSquare className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold">Messagerie en Temps Réel</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Communiquez instantanément avec les enseignants et les élèves via notre système de messagerie intégré.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <BarChart className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold">Analyses Détaillées</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Suivez les performances et l'engagement avec des tableaux de bord analytiques avancés.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Calendar className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold">Calendrier Interactif</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Gérez les événements, les cours et les devoirs avec notre calendrier intégré.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <LineChart className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold">Suivi des Progrès</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Visualisez la progression des élèves avec des graphiques interactifs et des métriques détaillées.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <GradeIcon className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold">Gestion des Notes</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Système complet de gestion des notes avec feedback et analyses de performance.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <GraduationCap className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-lg font-semibold">Classes Virtuelles</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Créez et rejoignez des salles de classe virtuelles avec vidéo en temps réel.
              </p>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button asChild size="lg" className="px-8">
              <Link href="/auth">Commencer</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="px-8">
              <Link href="/about">En Savoir Plus</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}