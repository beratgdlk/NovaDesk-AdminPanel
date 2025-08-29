import { createFileRoute } from '@tanstack/react-router';
import Dashboard from '#/features/dashboard';

export const Route = createFileRoute('/_authenticated/(admin)/')({
  component: Dashboard,
});

// ha burası da ana sayfa ama en son buraya bakalım
// settings kısmında da users ve rolse kısmı olacak ama oraya da en son bakalım
// şimdilik:
// - agent yönetimi
// - web chatbot yöentimi
// - web chatbot integrtion
// - wp yöentimi
// sayfalrının arayüzleri olsa oktur sonrasında api bağlarız 


// bir sorununuz var mıdır berat da kurulumu yaptı mu sorun yok hocam migrate aldı ayaga kaldırıcak sadece teşekkür ettim bir şey olursa rahatsız et lütfen np np tamamdır hocam sagolun görüşmöek üzere (: bb hoççakalın C: bb hocam