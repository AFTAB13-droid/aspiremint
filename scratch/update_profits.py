
import re

def update_orders_route():
    path = r'd:\MY PROJECT\ASPIREMINT\src\app\api\orders\route.ts'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Unified Admin Profit replacement
    admin_profit_pattern = r'adminProfit: \(\(\) => \{[\s\S]+?\}\)\(\),'
    replacement = """adminProfit: (() => {
            const originalRate = dealDoc.originalCommission || 0;
            const medName = assignedMediator.name?.toLowerCase() || "";
            const isJuhi = medName.includes("juhi");
            
            const mediatorRate = isJuhi 
               ? (dealDoc.juhiCommission || 0)
               : (() => {
                  const config = dealDoc.assignedMediators?.find((m: any) => m.mediatorId?.toString() === finalMediatorId.toString());
                  return config ? config.commission : (dealDoc.commission || 0);
               })();

            if (originalRate > 0 && mediatorRate < 0) {
               return Math.abs(originalRate) + Math.abs(mediatorRate);
            } else {
               return Math.abs(Math.abs(originalRate) - Math.abs(mediatorRate));
            }
         })(),"""
    
    new_content = re.sub(admin_profit_pattern, replacement, content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated orders/route.ts")

def update_orders_id_route():
    path = r'd:\MY PROJECT\ASPIREMINT\src\app\api\orders\[id]\route.ts'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Unified logic replacement
    pattern = r'if \(isJuhi\) \{[\s\S]+?updatePayload\.adminProfit = Math\.max\(0, Math\.abs\(originalRate\) - profit\);'
    replacement = """const mediatorRate = isJuhi 
                     ? (dealDoc.juhiCommission || 0)
                     : (() => {
                        const config = dealDoc.assignedMediators?.find((m: any) => m.mediatorId?.toString() === order.mediator.toString());
                        return config ? config.commission : (dealDoc.commission || 0);
                     })();

                  // NEW UNIFIED ADMIN PROFIT LOGIC
                  let calculatedAdminProfit = 0;
                  if (originalRate > 0 && mediatorRate < 0) {
                     calculatedAdminProfit = Math.abs(originalRate) + Math.abs(mediatorRate);
                  } else {
                     calculatedAdminProfit = Math.abs(Math.abs(originalRate) - Math.abs(mediatorRate));
                  }

                  updatePayload.adminProfit = calculatedAdminProfit;

                  if (isJuhi) {
                     updatePayload.mediatorCommission = Math.abs(mediatorRate);
                  } else {
                     // STANDARD MEDIATOR LOGIC: User Form Less vs Mediator Rate
                     updatePayload.mediatorCommission = Math.abs(Math.abs(userLess) - Math.abs(mediatorRate));
                  }"""
    
    new_content = re.sub(pattern, replacement, content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated orders/[id]/route.ts")

if __name__ == "__main__":
    update_orders_route()
    update_orders_id_route()
