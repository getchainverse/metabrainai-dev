import { Button, Table, Select, message } from "antd";
import { useState, useEffect } from "react";
import DocService from "../../../services/doc.service";

const { Option } = Select;

const roles = { "Level 1": "level", "Sales": "sales", "Manager": "admin", "V.P": "vp" };
const plainOptions = ["Level 1", "Sales", "Manager", "V.P"];

const BoardAccess = () => {
  const [kbData, setKbData] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: "Knowledge Base Name",
      dataIndex: "basename",
      key: "basename",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Assigned Roles",
      dataIndex: "roles",
      key: "roles",
      render: (text, record) => {
        // Map database role names back to UI labels
        const currentRoles = (record.Roles || []).map(r => {
          const found = Object.entries(roles).find(([k, v]) => v === r.name);
          return found ? found[0] : null;
        }).filter(Boolean);

        return (
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Assign Roles"
            defaultValue={currentRoles}
            onChange={(selectedLabels) => handleRoleChange(record.id, record.type, selectedLabels)}
          >
            {plainOptions.map(role => (
              <Option key={role} value={role}>{role}</Option>
            ))}
          </Select>
        );
      }
    },
  ];

  const handleRoleChange = (id, type, selectedLabels) => {
    const roleValues = selectedLabels.map(label => roles[label]);
    
    if (type === "Document") {
      DocService.updateDocRoles(id, roleValues).then(() => {
        message.success("Roles updated for Document");
      }).catch(e => message.error("Failed to update Document roles"));
    } else {
      DocService.updateWebRoles(id, roleValues).then(() => {
        message.success("Roles updated for Web URL");
      }).catch(e => message.error("Failed to update Web URL roles"));
    }
  };

  const getAllKnowledgeBases = async () => {
    setLoading(true);
    try {
      const [docsRes, websRes] = await Promise.all([
        DocService.getAllDocs(),
        DocService.getAllWebs()
      ]);
      
      const docs = (docsRes.data.message || []).map(d => ({ ...d, type: "Document", key: `doc-${d.id}` }));
      const webs = (websRes.data.message || []).map(w => ({ ...w, type: "Web URL", key: `web-${w.id}` }));
      
      setKbData([...docs, ...webs]);
    } catch (error) {
      console.log("error", error);
      message.error("Failed to load Knowledge Bases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllKnowledgeBases();
  }, []);

  return (
    <div className="w-9/12 px-10 border-l-2">
      <div className="flex justify-between items-center mt-10 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Knowledge Base Permissions</h2>
        <Button
          className="bg-[#0F7BDE] text-white"
          onClick={getAllKnowledgeBases}
          loading={loading}
        >
          Refresh
        </Button>
      </div>
      <Table
        bordered
        columns={columns}
        style={{
          width: "100%",
          wordWrap: "break-word",
          tableLayout: "fixed",
        }}
        dataSource={kbData}
        loading={loading}
      />
    </div>
  );
};

export default BoardAccess;
